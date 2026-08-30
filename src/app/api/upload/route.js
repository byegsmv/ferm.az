import { put } from "@vercel/blob";
import { rateLimit } from "@/lib/rateLimit";
import fs from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per image
const MAX_FILES = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// POST /api/upload — multipart/form-data with one or more "files" fields.
export async function POST(request) {
  try {
    const rl = rateLimit(request, { limit: 30, windowMs: 60_000, keyPrefix: "upload" });
    if (rl) return rl;

    let formData;
    try {
      formData = await request.formData();
    } catch (e) {
      return Response.json({ error: "Yanlış form-data formatı: " + (e.message || "") }, { status: 400 });
    }

    const files = formData.getAll("files").filter((f) => typeof f === "object" && f.size !== undefined);
    if (!files.length) {
      return Response.json({ error: "Heç bir fayl tapılmadı" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return Response.json({ error: `Ən çoxu ${MAX_FILES} şəkil yükləyə bilərsiniz` }, { status: 422 });
    }

    const uploaded = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return Response.json({ error: `Dəstəklənməyən fayl növü: ${file.type || "naməlum"}. Yalnız JPG, PNG, WEBP, GIF.` }, { status: 422 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return Response.json({ error: `Şəkil çox böyükdür (maks 5MB): ${file.name}` }, { status: 422 });
      }
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const blob = await put(key, file, { access: "public", contentType: file.type });
          uploaded.push({ url: blob.url });
          continue;
        } catch (blobErr) {
          console.error("Vercel Blob upload failed, falling back:", blobErr);
        }
      }
      
      // Fallback: Local filesystem or Data URI
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
        
        await fs.mkdir(uploadDir, { recursive: true });
        
        const fileName = key.replace("products/", "");
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        
        uploaded.push({ url: `/uploads/products/${fileName}` });
      } catch (fsErr) {
        // If filesystem is read-only (e.g. Vercel without BLOB token), generate high quality base64 data URI
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
        uploaded.push({ url: base64 });
      }
    }

    return Response.json({ images: uploaded }, { status: 201 });
  } catch (err) {
    console.error("Upload API Error:", err);
    return Response.json({ error: err.message || "Fayl yüklənərkən xəta baş verdi" }, { status: 500 });
  }
}
