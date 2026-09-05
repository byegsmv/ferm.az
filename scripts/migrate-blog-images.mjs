/**
 * One-time migration: download every pollinations.ai image referenced in
 * existing blog posts (cover + inline) and re-host on Vercel Blob, then
 * rewrite the DB records so all past posts show reliable images.
 *
 * Usage (run from repo root, envs provided inline):
 *   DATABASE_URL="..." BLOB_READ_WRITE_TOKEN="..." node scripts/migrate-blog-images.mjs
 */
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const prisma = new PrismaClient();
const POLLINATIONS_RE = /https:\/\/image\.pollinations\.ai\/prompt\/[^\s"'<>)]+/gi;

function findUrls(text) {
  if (!text) return [];
  const matches = text.match(POLLINATIONS_RE) || [];
  return [...new Set(matches.map((u) => u.replace(/&amp;/g, "&")))];
}

async function download(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
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

async function main() {
  const posts = await prisma.blogPost.findMany({
    where: { OR: [{ contentAz: { contains: "pollinations" } }, { coverUrl: { contains: "pollinations" } }] },
    select: { id: true, slug: true, contentAz: true, coverUrl: true },
  });
  console.log(`Found ${posts.length} post(s) with pollinations images.`);

  for (const post of posts) {
    console.log(`\nPost: ${post.slug}`);
    const urls = [...findUrls(post.contentAz), ...findUrls(post.coverUrl)];
    const map = new Map();
    for (const url of urls) {
      let d = await download(url);
      if (!d) d = await download(url);
      if (!d) { console.log(`  ✗ FAILED: ${url.slice(0, 80)}...`); continue; }
      const ext = d.contentType.includes("png") ? "png" : "jpg";
      const key = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const blob = await put(key, d.buffer, { access: "public", contentType: d.contentType });
      map.set(url, blob.url);
      console.log(`  ✓ migrated (${Math.round(d.buffer.length/1024)}KB)`);
    }
    if (map.size > 0) {
      let content = post.contentAz || "";
      let cover = post.coverUrl || "";
      for (const [orig, hosted] of map) {
        const esc = orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        content = content.replace(new RegExp(esc, "g"), hosted);
        if (cover === orig) cover = hosted;
      }
      await prisma.blogPost.update({ where: { id: post.id }, data: { contentAz: content, coverUrl: cover } });
      console.log(`  ★ DB updated (${map.size} image(s)).`);
    }
  }
  await prisma.$disconnect();
  console.log("\nMigration done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
