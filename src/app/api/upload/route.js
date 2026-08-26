import { put } from "@vercel/blob";
import { rateLimit } from "@/lib/rateLimit";
import fs from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per image
const MAX_FILES = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// POST /api/upload — multipart/form-data with one or more "files" fields.
// Open to guests too (guest classifieds need to upload photos without an account),
// but validated for type/size/count to prevent abuse.
export async function POST(request) {
  const rl = rateLimit(request, { limit: 20, windowMs: 60_000, keyPrefix: "upload" });
  if (rl) return rl;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Yanlış form-data formatı" }, { status: 400 });
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
      const blob = await put(key, file, { access: "public", contentType: file.type });
      uploaded.push({ url: blob.url });
    } else {
      // Local fallback
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
      
      try {
        await fs.access(uploadDir);
      } catch {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      
      const fileName = key.replace("products/", "");
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      
      uploaded.push({ url: `/uploads/products/${fileName}` });
    }
  }

  return Response.json({ images: uploaded }, { status: 201 });
}
