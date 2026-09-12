import fs from "fs";
import path from "path";
import crypto from "crypto";

const MIME_MAP = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export function getMediaDir() {
  return process.env.MEDIA_DIR || path.join(process.cwd(), "media");
}

export function saveImageFromBuffer(buf, mime = "image/jpeg") {
  const dir = getMediaDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const cleanMime = (mime || "image/jpeg").toLowerCase().split(";")[0].trim();
  const ext = MIME_MAP[cleanMime] || cleanMime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buf);
  return `/media/${filename}`;
}

export function saveImageFromBase64(dataUri) {
  if (typeof dataUri !== "string" || !dataUri.startsWith("data:")) {
    throw new Error("Invalid base64 data URI");
  }
  const match = dataUri.match(/^data:([^;,]+);base64,(.*)$/s);
  if (!match) {
    throw new Error("Malformed base64 data URI");
  }
  const mime = match[1];
  const buf = Buffer.from(match[2], "base64");
  return saveImageFromBuffer(buf, mime);
}
