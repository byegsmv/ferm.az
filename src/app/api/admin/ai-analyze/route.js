import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { geminiGenerate } from "@/lib/gemini";
import { mapProductImages } from "@/lib/imageUrl";

/**
 * POST /api/admin/ai-analyze { productId }
 * Məhsul şəklini görüb AI ilə düzgün bölmələri doldurur:
 * başlıq (qablaşdırma ölçüsü daxil), təsvir, kateqoriya, korporativ qiymət təklifi.
 */
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role)) {
    return Response.json({ error: "Yalnız admin" }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Yanlış JSON" }, { status: 400 }); }
  const { productId } = body;
  if (!productId) return Response.json({ error: "productId tələb olunur" }, { status: 422 });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true, category: { select: { id: true, nameAz: true } } },
  });
  if (!product) return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
  if (!product.images.length) return Response.json({ error: "Məhsulun şəkli yoxdur" }, { status: 422 });

  // Şəkli base64-ə çevir
  const rawUrl = product.images[0].url;
  let imageBase64 = null, imageMimeType = "image/jpeg";
  try {
    if (rawUrl.startsWith("data:")) {
      const m = rawUrl.match(/^data:([^;]+);base64,(.*)$/);
      if (m) { imageMimeType = m[1]; imageBase64 = m[2]; }
    } else {
      const res = await fetch(rawUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      imageMimeType = res.headers.get("content-type") || "image/jpeg";
      imageBase64 = buf.toString("base64");
    }
  } catch (e) {
    return Response.json({ error: "Şəkil oxuna bilmədi" }, { status: 422 });
  }
  if (!imageBase64) return Response.json({ error: "Şəkil oxuna bilmədi" }, { status: 422 });

  // Kateqoriya siyahısı
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, nameAz: true },
    take: 200,
  });

  const prompt = `Sən Azərbaycandakı kənd təsərrüfatı (agro) mağazası "FermerMarket MMC"-nin məhsul analitikisan.
Şəkil məhsul fotosudur. Əvvəlki başlıq (fayl adından): "${product.titleAz}".

Şəkli analiz et və YALNIZ bu JSON formatında cavab ver:
{
  "title": "məhsulun Azərbaycan dilində tam adı — brend + məhsul + qablaşdırma ölçüsü (məs. 'EvroHim KAS-32 (1 Litr)'). Ölçü görünürsə mütləq mötərizədə əlavə et",
  "description": "2-4 cümləlik satış təsviri: nə üçün istifadə olunur, tətbiq üsulu, faydası",
  "categoryId": "aşağıdakı siyahıdan ən uyğun kateqoriyanın ID-si",
  "isCorporate": "toplanma satışı varsa true, əks halda false"
}

Kateqoriyalar:
${categories.map(c => `${c.id} = ${c.nameAz}`).join("\n")}

QAYDALAR: satış vahidi həmişə "ədəd"dir (maye/kq belə qabla satılır, vahidi dəyişmə). Başlıqda ölçü qeyd et. Qiymət yazma. Yalnız JSON qaytar.`;

  const aiText = await geminiGenerate({ prompt, imageBase64, imageMimeType, jsonMode: true, maxOutputTokens: 1024 });
  if (!aiText || !aiText.trim()) {
    return Response.json({ error: "AI hazırda cavab vermir — bir azdan yenidən cəhd edin və ya əllə doldurun", aiFailed: true }, { status: 503 });
  }

  // JSON çıxar
  let parsed;
  try {
    const m = aiText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(m ? m[0] : aiText);
  } catch {
    return Response.json({ error: "AI cavabı oxuna bilmədi", raw: aiText.slice(0, 300) }, { status: 502 });
  }

  const updateData = {};
  if (parsed.title && typeof parsed.title === "string") updateData.titleAz = parsed.title.slice(0, 150);
  if (parsed.description && typeof parsed.description === "string") updateData.descriptionAz = parsed.description.slice(0, 2000);
  const matchedCat = categories.find(c => c.id === parsed.categoryId);
  if (matchedCat) updateData.categoryId = matchedCat.id;
  if (typeof parsed.isCorporate === "boolean") updateData.isCorporate = parsed.isCorporate;

  let updated = product;
  if (Object.keys(updateData).length) {
    updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: { images: true, category: { select: { id: true, nameAz: true } } },
    });
  }

  return Response.json({ product: mapProductImages(updated), aiProvider: "chain" });
}
