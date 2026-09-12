import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { parseProxyImageId } from "@/lib/imageUrl";
import { saveImageFromBase64 } from "@/lib/localMedia";

// Gələn images massivini "təhlükəsiz" hala gətirir — iki kök problemi həll edir:
//
// 1) PROXY İSTİNADLARI (data loss bug): formalar API cavabından gələn
//    "/api/img/<id>" yollarını geri göndərirlər. PATCH əvvəlki şəkil qeydlərini
//    silib yenidən yaradır — həll edilməsə, yeni qeyd artıq mövcud olmayan
//    qeydə işarə edir və şəkil 404 düşür (datanın özü silinir).
//    Həll: istinad id-ləri mövcud qeydlərin ƏSL url-ləri ilə əvəz olunur.
//
// 2) BASE64 KÖÇÜRÜLMƏSİ (Neon egress): data: URI kimi göndərilən şəkillər
//    Vercel Blob və ya yerli diskə yüklənib URL ilə əvəz olunur.
export async function normalizeIncomingImages(images, existingRows = []) {
  if (!Array.isArray(images) || images.length === 0) return images;

  // ── 1) proxy istinadlarını həll et
  const idMap = new Map();
  for (const r of existingRows) if (r?.id) idMap.set(r.id, r.url);

  const refIds = images
    .map((img) => parseProxyImageId(img?.url))
    .filter((id) => id && !idMap.has(id));
  if (refIds.length) {
    try {
      const rows = await prisma.productImage.findMany({
        where: { id: { in: refIds } },
        select: { id: true, url: true },
      });
      for (const r of rows) idMap.set(r.id, r.url);
    } catch { /* DB xətası — istinadlar olduğu kimi qalır */ }
  }

  let resolved = images.map((img) => {
    const refId = parseProxyImageId(img?.url);
    const target = refId ? idMap.get(refId) : null;
    return target ? { ...img, url: target } : img;
  });

  // ── 2) data: URI-ləri Vercel Blob və ya local disk-ə köçür (uğursuzsa base64 qalır)
  resolved = await Promise.all(
    resolved.map(async (img) => {
      if (typeof img?.url !== "string" || !img.url.startsWith("data:")) return img;
      try {
        if (process.env.MEDIA_STORAGE === "local") {
          const localUrl = saveImageFromBase64(img.url);
          return { ...img, url: localUrl };
        }
        const m = img.url.match(/^data:([^;,]+);base64,(.*)$/s);
        if (!m) return img;
        const buf = Buffer.from(m[2], "base64");
        const ext = (m[1].split("/")[1] || "png").replace("jpeg", "jpg");
        const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const blob = await put(key, buf, { contentType: m[1], access: "public" });
        return { ...img, url: blob.url };
      } catch {
        return img; // Blob/Local xətası — base64 saxla, əməliyyatı bloklama
      }
    })
  );

  return resolved;
}
