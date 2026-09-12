import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { saveImageFromBuffer, saveImageFromBase64 } from "../src/lib/localMedia.js";

// Load env vars manually
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

if (fs.existsSync(".env.production")) {
  loadEnvFile(".env.production");
} else {
  loadEnvFile(".env");
}

const prisma = new PrismaClient();

async function downloadUrl(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "FermerMarket-Migrator/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    return { buffer, contentType };
  } finally {
    clearTimeout(timer);
  }
}

async function processImageValue(val) {
  if (!val || typeof val !== "string") return null;
  val = val.trim();
  if (val.startsWith("/media/") || val.startsWith("/blog/")) {
    return null; // already migrated or static local file
  }

  if (val.startsWith("data:")) {
    const match = val.match(/^data:([^;,]+);base64,(.*)$/s);
    if (!match) throw new Error("Invalid base64 format");
    const buf = Buffer.from(match[2], "base64");
    const localPath = saveImageFromBase64(val);
    return { localPath, bytes: buf.length, isBase64: true };
  }

  if (val.startsWith("http://") || val.startsWith("https://")) {
    const { buffer, contentType } = await downloadUrl(val);
    const localPath = saveImageFromBuffer(buffer, contentType);
    return { localPath, bytes: buffer.length, isBase64: false };
  }

  return null;
}

async function main() {
  console.log("Starting media migration script...");
  const report = {
    timestamp: new Date().toISOString(),
    productImages: { total: 0, base64: 0, external: 0 },
    stores: { total: 0, logo: 0, cover: 0 },
    blogPosts: { total: 0, cover: 0, content: 0 },
    totalBytes: 0,
    failures: [],
  };

  // 1. ProductImage
  try {
    const productImages = await prisma.productImage.findMany({
      select: { id: true, url: true },
    });

    for (const img of productImages) {
      if (!img.url) continue;
      try {
        const res = await processImageValue(img.url);
        if (res) {
          await prisma.productImage.update({
            where: { id: img.id },
            data: { url: res.localPath },
          });
          report.productImages.total++;
          if (res.isBase64) report.productImages.base64++;
          else report.productImages.external++;
          report.totalBytes += res.bytes;
          console.log(`ProductImage ${img.id} migrated -> ${res.localPath} (${res.bytes} bytes)`);
        }
      } catch (err) {
        console.error(`Failed ProductImage ${img.id}:`, err.message);
        report.failures.push({
          table: "ProductImage",
          id: img.id,
          url: img.url.slice(0, 100),
          error: err.message,
        });
      }
    }
  } catch (err) {
    console.error("Error querying ProductImage:", err.message);
  }

  // 2. Store (logoUrl, coverUrl)
  try {
    const stores = await prisma.store.findMany({
      select: { id: true, logoUrl: true, coverUrl: true },
    });

    for (const store of stores) {
      const updates = {};
      let updatedStore = false;

      if (store.logoUrl) {
        try {
          const res = await processImageValue(store.logoUrl);
          if (res) {
            updates.logoUrl = res.localPath;
            report.stores.logo++;
            report.totalBytes += res.bytes;
            updatedStore = true;
            console.log(`Store ${store.id} logo migrated -> ${res.localPath}`);
          }
        } catch (err) {
          console.error(`Failed Store logo ${store.id}:`, err.message);
          report.failures.push({ table: "Store", field: "logoUrl", id: store.id, error: err.message });
        }
      }

      if (store.coverUrl) {
        try {
          const res = await processImageValue(store.coverUrl);
          if (res) {
            updates.coverUrl = res.localPath;
            report.stores.cover++;
            report.totalBytes += res.bytes;
            updatedStore = true;
            console.log(`Store ${store.id} cover migrated -> ${res.localPath}`);
          }
        } catch (err) {
          console.error(`Failed Store cover ${store.id}:`, err.message);
          report.failures.push({ table: "Store", field: "coverUrl", id: store.id, error: err.message });
        }
      }

      if (updatedStore) {
        await prisma.store.update({
          where: { id: store.id },
          data: updates,
        });
        report.stores.total++;
      }
    }
  } catch (err) {
    console.error("Error querying Store:", err.message);
  }

  // 3. BlogPost (coverUrl, contentAz)
  try {
    const posts = await prisma.blogPost.findMany({
      select: { id: true, coverUrl: true, contentAz: true },
    });

    for (const post of posts) {
      const updates = {};
      let updatedPost = false;

      if (post.coverUrl) {
        try {
          const res = await processImageValue(post.coverUrl);
          if (res) {
            updates.coverUrl = res.localPath;
            report.blogPosts.cover++;
            report.totalBytes += res.bytes;
            updatedPost = true;
            console.log(`BlogPost ${post.id} cover migrated -> ${res.localPath}`);
          }
        } catch (err) {
          console.error(`Failed BlogPost cover ${post.id}:`, err.message);
          report.failures.push({ table: "BlogPost", field: "coverUrl", id: post.id, error: err.message });
        }
      }

      if (post.contentAz) {
        const URL_REGEX = /https?:\/\/[^\s"'<>)]+\.(?:png|jpg|jpeg|webp|gif)/gi;
        const matches = [...new Set(post.contentAz.match(URL_REGEX) || [])];
        let newContent = post.contentAz;
        for (const extUrl of matches) {
          try {
            const res = await processImageValue(extUrl);
            if (res) {
              const escaped = extUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              newContent = newContent.replace(new RegExp(escaped, "g"), res.localPath);
              report.blogPosts.content++;
              report.totalBytes += res.bytes;
              updatedPost = true;
              console.log(`BlogPost ${post.id} content image migrated -> ${res.localPath}`);
            }
          } catch (err) {
            console.error(`Failed BlogPost content image ${post.id} (${extUrl}):`, err.message);
            report.failures.push({ table: "BlogPost", field: "contentAz", id: post.id, url: extUrl, error: err.message });
          }
        }
        if (newContent !== post.contentAz) {
          updates.contentAz = newContent;
        }
      }

      if (updatedPost) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: updates,
        });
        report.blogPosts.total++;
      }
    }
  } catch (err) {
    console.error("Error querying BlogPost:", err.message);
  }

  // Write JSON report
  const reportPath = process.env.REPORT_PATH || "/var/www/fermermarket/media-migration-report.json";
  try {
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report written to ${reportPath}`);
  } catch (err) {
    console.error(`Could not write report to ${reportPath}:`, err.message);
  }

  console.log("Migration finished summary:", JSON.stringify(report, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Migration fatal error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
