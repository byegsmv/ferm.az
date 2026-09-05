/**
 * Blog image persistence + quality helper.
 *
 * Pollinations.ai image URLs are generated on-the-fly and have two problems:
 *  1) They are slow/unreliable/rate-limited in browsers (broken images).
 *  2) The raw generated JPEG is heavily compressed and looks blocky/pixelated
 *     when stretched to the blog's full content width by CSS (`width: 100%`).
 *
 * This module downloads them once, re-encodes them at a clean target size
 * with high-quality resampling (supersample-then-downscale removes the
 * generator's block artifacts), and re-hosts the result on Vercel Blob so
 * they load fast, look sharp at any display width, and never break.
 */
import { put } from "@vercel/blob";
import sharp from "sharp";

const POLLINATIONS_RE = /https:\/\/image\.pollinations\.ai\/prompt\/[^\s"'<>)]+/gi;

// Minimum source resolution we request FROM pollinations before downscaling.
// Requesting at least this wide forces the generator to render more detail,
// which we then supersample-downscale — this is what actually removes the
// blocky/pixelated look, not just re-compressing the same low-res source.
const MIN_SOURCE_WIDTH = 1600;
// Max width we ever display a blog image at (blog column caps ~736px,
// homepage/list cards are narrower) — smaller than MIN_SOURCE_WIDTH on
// purpose so the downscale step genuinely smooths generator artifacts.
const TARGET_MAX_WIDTH = 1200;
const JPEG_QUALITY = 88;

// Rewrites a pollinations.ai URL's width/height query params up to at least
// MIN_SOURCE_WIDTH (preserving aspect ratio) so we always fetch a
// high-detail source to downscale from, even for older posts that stored a
// low-resolution URL (e.g. width=1024).
function upscaleSourceRequest(url) {
  try {
    const u = new URL(url);
    const w = parseInt(u.searchParams.get("width") || "0", 10);
    const h = parseInt(u.searchParams.get("height") || "0", 10);
    if (w > 0 && h > 0 && w < MIN_SOURCE_WIDTH) {
      const ratio = h / w;
      u.searchParams.set("width", String(MIN_SOURCE_WIDTH));
      u.searchParams.set("height", String(Math.round(MIN_SOURCE_WIDTH * ratio)));
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

// Find all pollinations URLs inside a text (content HTML or a single cover URL)
export function findPollinationsUrls(text) {
  if (!text) return [];
  const matches = text.match(POLLINATIONS_RE) || [];
  return [...new Set(matches.map((u) => u.replace(/&amp;/g, "&")))];
}

async function downloadWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 FermerMarket/1.0" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1024) return null; // bogus/error payload
    return { buffer, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Re-encodes a raw downloaded image to remove generator block artifacts:
 * resizes down (never up) to TARGET_MAX_WIDTH with high-quality (lanczos3)
 * resampling and re-compresses as a clean mozjpeg JPEG. Falls back to the
 * original buffer if processing fails for any reason.
 */
async function sharpen(buffer) {
  try {
    const processed = await sharp(buffer)
      .resize({ width: TARGET_MAX_WIDTH, withoutEnlargement: true, kernel: "lanczos3" })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    return { buffer: processed, contentType: "image/jpeg" };
  } catch (err) {
    console.error("blogImages: sharpen failed, using original:", err?.message);
    return null;
  }
}

/**
 * Download every pollinations URL in `content` (HTML) and `coverUrl`,
 * quality-process, upload to Vercel Blob, and return rewritten content/coverUrl.
 * On any failure the original URL is kept (graceful degradation).
 */
export async function persistBlogImages(content, coverUrl) {
  const result = { content: content || "", coverUrl: coverUrl || "" };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return result;

  const urlMap = new Map(); // original -> blob url
  const urls = [...findPollinationsUrls(result.content), ...findPollinationsUrls(result.coverUrl)];

  for (const url of urls) {
    if (urlMap.has(url)) continue;
    const fetchUrl = upscaleSourceRequest(url);
    let downloaded = await downloadWithTimeout(fetchUrl, 60_000);
    if (!downloaded) downloaded = await downloadWithTimeout(fetchUrl, 60_000); // one retry (generation can be slow)
    if (!downloaded && fetchUrl !== url) downloaded = await downloadWithTimeout(url, 60_000); // fall back to original size
    if (!downloaded) continue;

    const sharpened = await sharpen(downloaded.buffer);
    const finalImg = sharpened || downloaded;

    try {
      const ext = finalImg.contentType.includes("png") ? "png" : "jpg";
      const key = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const blob = await put(key, finalImg.buffer, {
        access: "public",
        contentType: finalImg.contentType,
      });
      urlMap.set(url, blob.url);
    } catch (err) {
      console.error("blogImages: blob put failed:", err?.message);
    }
  }

  for (const [original, hosted] of urlMap) {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result.content = result.content.replace(new RegExp(escaped, "g"), hosted);
    if (result.coverUrl === original) result.coverUrl = hosted;
  }

  return result;
}

/**
 * One-time/healing migration: re-host + quality-fix pollinations images of
 * EXISTING posts on Vercel Blob (pollinations rate-limits with 429s and its
 * raw output is blocky when stretched → broken/pixelated images).
 * Also re-processes posts whose cover/content already point at a Blob URL
 * but were uploaded before the quality fix (re-fetches from Blob, sharpens,
 * re-uploads) so older migrated posts get fixed too.
 * Processes as many posts as fit in `budgetMs`. Safe to run repeatedly.
 */
export async function migrateBlogImages(budgetMs = 50000) {
  const { prisma } = await import("@/lib/prisma");
  const deadline = Date.now() + budgetMs;
  let migrated = 0, checked = 0;

  let posts;
  try {
    posts = await prisma.blogPost.findMany({
      where: { OR: [{ contentAz: { contains: "pollinations" } }, { coverUrl: { contains: "pollinations" } }] },
      select: { id: true, contentAz: true, coverUrl: true },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
  } catch {
    return { migrated, checked: 0, remaining: -1 };
  }

  for (const post of posts) {
    if (Date.now() > deadline) break;
    checked++;
    try {
      const persisted = await persistBlogImages(post.contentAz, post.coverUrl);
      if (persisted.content !== post.contentAz || persisted.coverUrl !== post.coverUrl) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { contentAz: persisted.content, coverUrl: persisted.coverUrl },
        });
        migrated++;
      }
    } catch (err) {
      console.error("migrateBlogImages: post failed:", post.id, err?.message);
    }
  }

  let remaining = -1;
  try {
    remaining = await prisma.blogPost.count({
      where: { OR: [{ contentAz: { contains: "pollinations" } }, { coverUrl: { contains: "pollinations" } }] },
    });
  } catch {}

  return { migrated, checked, remaining };
}

/**
 * Re-processes images that are ALREADY on Vercel Blob but were uploaded
 * before the quality (sharpen/resize) fix shipped — fetches each blob image,
 * re-encodes it with sharpen(), and re-uploads in place (new blob key,
 * old one is superseded in the DB record). Use this once to fix pixelation
 * on posts migrated before this fix.
 */
export async function requalifyBlobImages(budgetMs = 50000) {
  const { prisma } = await import("@/lib/prisma");
  const deadline = Date.now() + budgetMs;
  let fixed = 0, checked = 0;

  let posts;
  try {
    posts = await prisma.blogPost.findMany({
      where: { OR: [{ contentAz: { contains: "blob.vercel-storage.com" } }, { coverUrl: { contains: "blob.vercel-storage.com" } }] },
      select: { id: true, contentAz: true, coverUrl: true },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
  } catch {
    return { fixed, checked: 0 };
  }

  const BLOB_IMG_RE = /https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[^\s"'<>)]+/gi;

  for (const post of posts) {
    if (Date.now() > deadline) break;
    checked++;
    const urls = [...new Set([...(post.contentAz || "").match(BLOB_IMG_RE) || [], ...((post.coverUrl && post.coverUrl.match(BLOB_IMG_RE)) || [])])];
    if (urls.length === 0) continue;

    let content = post.contentAz || "";
    let coverUrl = post.coverUrl || "";
    let changed = false;

    for (const url of urls) {
      const downloaded = await downloadWithTimeout(url, 30_000);
      if (!downloaded) continue;
      const sharpened = await sharpen(downloaded.buffer);
      if (!sharpened) continue;
      try {
        const key = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
        const blob = await put(key, sharpened.buffer, { access: "public", contentType: "image/jpeg" });
        const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        content = content.replace(new RegExp(escaped, "g"), blob.url);
        if (coverUrl === url) coverUrl = blob.url;
        changed = true;
      } catch (err) {
        console.error("requalifyBlobImages: blob put failed:", err?.message);
      }
    }

    if (changed) {
      await prisma.blogPost.update({ where: { id: post.id }, data: { contentAz: content, coverUrl } });
      fixed++;
    }
  }

  return { fixed, checked };
}
