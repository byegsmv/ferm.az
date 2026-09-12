/**
 * Blog image persistence + quality helper.
 */
import { put } from "@vercel/blob";
import sharp from "sharp";
import { saveImageFromBuffer } from "@/lib/localMedia";

const POLLINATIONS_RE = /https:\/\/image\.pollinations\.ai\/prompt\/[^\s"'<>)]+/gi;
const MEDIA44_RE = /https:\/\/media\.base44\.com\/[^\s"'<>)]+/gi;

const MIN_SOURCE_WIDTH = 1600;
const TARGET_MAX_WIDTH = 1200;
const JPEG_QUALITY = 88;

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

export function findPollinationsUrls(text) {
  if (!text) return [];
  const matches = [
    ...(text.match(POLLINATIONS_RE) || []),
    ...(text.match(MEDIA44_RE) || []),
  ];
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
    if (buffer.length < 1024) return null;
    return { buffer, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

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

export async function persistBlogImages(content, coverUrl) {
  const result = { content: content || "", coverUrl: coverUrl || "" };
  if (process.env.MEDIA_STORAGE !== "local" && !process.env.BLOB_READ_WRITE_TOKEN) return result;

  const urlMap = new Map();
  const urls = [...findPollinationsUrls(result.content), ...findPollinationsUrls(result.coverUrl)];

  for (const url of urls) {
    if (urlMap.has(url)) continue;
    const fetchUrl = upscaleSourceRequest(url);
    let downloaded = await downloadWithTimeout(fetchUrl, 60_000);
    if (!downloaded) downloaded = await downloadWithTimeout(fetchUrl, 60_000);
    if (!downloaded && fetchUrl !== url) downloaded = await downloadWithTimeout(url, 60_000);
    if (!downloaded) continue;

    const sharpened = await sharpen(downloaded.buffer);
    const finalImg = sharpened || downloaded;

    try {
      if (process.env.MEDIA_STORAGE === "local") {
        const localUrl = saveImageFromBuffer(finalImg.buffer, finalImg.contentType);
        urlMap.set(url, localUrl);
      } else {
        const ext = finalImg.contentType.includes("png") ? "png" : "jpg";
        const key = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
        const blob = await put(key, finalImg.buffer, {
          access: "public",
          contentType: finalImg.contentType,
        });
        urlMap.set(url, blob.url);
      }
    } catch (err) {
      console.error("blogImages: storage save failed:", err?.message);
    }
  }

  for (const [original, hosted] of urlMap) {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result.content = result.content.replace(new RegExp(escaped, "g"), hosted);
    if (result.coverUrl === original) result.coverUrl = hosted;
  }

  return result;
}

export async function migrateBlogImages(budgetMs = 50000) {
  const { prisma } = await import("@/lib/prisma");
  const deadline = Date.now() + budgetMs;
  let migrated = 0, checked = 0;

  let posts;
  try {
    posts = await prisma.blogPost.findMany({
      where: { OR: [{ contentAz: { contains: "pollinations" } }, { coverUrl: { contains: "pollinations" } }, { contentAz: { contains: "media.base44.com" } }, { coverUrl: { contains: "media.base44.com" } }] },
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
      where: { OR: [{ contentAz: { contains: "pollinations" } }, { coverUrl: { contains: "pollinations" } }, { contentAz: { contains: "media.base44.com" } }, { coverUrl: { contains: "media.base44.com" } }] },
    });
  } catch {}

  return { migrated, checked, remaining };
}

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
        if (process.env.MEDIA_STORAGE === "local") {
          const localUrl = saveImageFromBuffer(sharpened.buffer, sharpened.contentType);
          const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          content = content.replace(new RegExp(escaped, "g"), localUrl);
          if (coverUrl === url) coverUrl = localUrl;
          changed = true;
        } else {
          const key = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
          const blob = await put(key, sharpened.buffer, { access: "public", contentType: "image/jpeg" });
          const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          content = content.replace(new RegExp(escaped, "g"), blob.url);
          if (coverUrl === url) coverUrl = blob.url;
          changed = true;
        }
      } catch (err) {
        console.error("requalifyBlobImages: storage save failed:", err?.message);
      }
    }

    if (changed) {
      await prisma.blogPost.update({ where: { id: post.id }, data: { contentAz: content, coverUrl } });
      fixed++;
    }
  }

  return { fixed, checked };
}
