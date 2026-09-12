import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

// Keşlənə bilən şəkil proxy-si: base64 və ya local media şəkillərini binary cavab kimi qaytarır
// (browser bunu bir dəfə yükləyir və 1 il boyunca keşdə saxlayır)
export async function GET(request, { params }) {
  const { id } = await params;
  let dataUrl = null;

  try {
    if (id.startsWith("st-") || id.startsWith("sc-")) {
      const storeId = id.slice(3);
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { logoUrl: true, coverUrl: true },
      });
      if (!store) return new Response("Not found", { status: 404 });
      dataUrl = id.startsWith("st-") ? store.logoUrl : store.coverUrl;
    } else {
      const img = await prisma.productImage.findUnique({
        where: { id },
        select: { url: true },
      });
      if (!img) return new Response("Not found", { status: 404 });
      dataUrl = img.url;
    }
  } catch {
    return new Response("DB error", { status: 500 });
  }

  if (!dataUrl) return new Response("Not found", { status: 404 });

  if (dataUrl.startsWith("/media/")) {
    try {
      const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), "media");
      const filename = path.basename(dataUrl);
      const filePath = path.join(mediaDir, filename);
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(filename).toLowerCase().replace(".", "");
      let contentType = "image/jpeg";
      if (ext === "png") contentType = "image/png";
      else if (ext === "webp") contentType = "image/webp";
      else if (ext === "gif") contentType = "image/gif";
      else if (ext === "svg") contentType = "image/svg+xml";

      return new Response(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(fileBuffer.length),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  if (!dataUrl.startsWith("data:")) {
    // adi URL — birbaşa yönləndir
    return Response.redirect(dataUrl, 302);
  }

  const m = dataUrl.match(/^data:([^;,]+);base64,(.*)$/s);
  if (!m) return new Response("Invalid image", { status: 422 });

  const buf = Buffer.from(m[2], "base64");
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": m[1],
      "Content-Length": String(buf.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
