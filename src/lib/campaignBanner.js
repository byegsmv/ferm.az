/**
 * Campaign banner AI-size optimization.
 *
 * Admin-uploaded banners arrive as base64 data URIs. Storing them raw in the
 * DB repeats the exact mistake that cost us the Neon egress quota (base64 blobs
 * shipped from Postgres on every page view). Instead: decode, resize to the
 * placement's target box with high-quality resampling, re-encode at web
 * quality, and host on Vercel Blob — the same pattern as blogImages.js.
 *
 * NEVER throws: on any problem the original value is returned untouched so
 * campaign creation is never blocked by image processing.
 */
import sharp from "sharp";
import { put } from "@vercel/blob";

// Target boxes per campaign type (IAB-ish, cover-cropped, never upscaled).
const TARGETS = {
  HOMEPAGE_BANNER: { w: 1200, h: 400 },
  CATEGORY_BANNER: { w: 1200, h: 300 },
  STORE_PROMOTION: { w: 800, h: 450 },
  FLASH_SALE: { w: 800, h: 450 },
  DAILY_DEAL: { w: 800, h: 450 },
  SPONSORED_PRODUCT: { w: 600, h: 600 },
  REGIONAL: { w: 1200, h: 300 },
};

function parseDataUri(uri) {
  const m = /^data:(image\/(?:png|jpe?g|webp|avif));base64,(.+)$/.exec(uri || "");
  if (!m) return null;
  try {
    return { contentType: m[1], buffer: Buffer.from(m[2], "base64") };
  } catch {
    return null;
  }
}

export async function optimizeCampaignBanner(bannerUrl, type) {
  if (!bannerUrl || typeof bannerUrl !== "string") return bannerUrl;
  if (!bannerUrl.startsWith("data:")) return bannerUrl; // already hosted / external — leave it
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("campaignBanner: no BLOB_READ_WRITE_TOKEN, keeping original image");
    return bannerUrl;
  }

  const parsed = parseDataUri(bannerUrl);
  if (!parsed) {
    console.warn("campaignBanner: unsupported data URI, keeping original");
    return bannerUrl;
  }

  const target = TARGETS[type] || TARGETS.STORE_PROMOTION;

  try {
    const meta = await sharp(parsed.buffer).metadata();
    const hasAlpha = Boolean(meta.hasAlpha);

    const out = await sharp(parsed.buffer)
      .resize(target.w, target.h, { fit: "cover", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer({ resolveWithObject: true })
      .then(async (pngResult) => {
        // Prefer JPEG for opaque images (much smaller); keep PNG when there is
        // transparency so logo-style banners don't get a black background.
        if (hasAlpha) return { buffer: pngResult.buffer, contentType: "image/png", ext: "png" };
        const jpg = await sharp(parsed.buffer)
          .resize(target.w, target.h, { fit: "cover", withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();
        return jpg.byteLength < pngResult.buffer.byteLength
          ? { buffer: jpg, contentType: "image/jpeg", ext: "jpg" }
          : { buffer: pngResult.buffer, contentType: "image/png", ext: "png" };
      });

    const key = `campaigns/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${out.ext}`;
    const blob = await put(key, out.buffer, { access: "public", contentType: out.contentType });

    console.log(`campaignBanner: optimized ${type} → ${target.w}×${target.h} (${Math.round(out.buffer.byteLength / 1024)} KB) → blob`);
    return blob.url;
  } catch (err) {
    console.error("campaignBanner: optimization failed, keeping original:", err?.message || err);
    return bannerUrl;
  }
}
