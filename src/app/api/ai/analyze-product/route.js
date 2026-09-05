import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { geminiGenerate, geminiDebug } from "@/lib/gemini";

// POST /api/ai/analyze-product
// AI-assisted quick listing: analyzes image + short info text and returns
// a ready-to-edit product draft (title, description, category, unit, price hints)
// plus a list of missing fields to ask the user about.
//
// Permission: ADMIN/SUPER_ADMIN always; other users need the BULK_CSV module.
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(authUser.role);
  if (!isAdmin) {
    const mod = await prisma.userModule.findFirst({
      where: { userId: authUser.sub, module: "BULK_CSV" },
    });
    if (!mod) return Response.json({ error: "Bu modul üçün icazəniz yoxdur" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON" }, { status: 400 });
  }

  const infoText = (body.infoText || "").trim();
  let imageBase64 = body.imageBase64 || null;
  let imageMimeType = body.imageMimeType || "image/jpeg";

  // Convenience: accept an uploaded image URL (e.g. Vercel Blob) and fetch it
  // server-side, converting to base64 for the Gemini vision request.
  if (!imageBase64 && body.imageUrl) {
    try {
      const imgRes = await fetch(body.imageUrl, { method: "GET" });
      if (!imgRes.ok) throw new Error("Şəkil yüklənmədi");
      imageMimeType = imgRes.headers.get("content-type") || "image/jpeg";
      const buf = Buffer.from(await imgRes.arrayBuffer());
      imageBase64 = buf.toString("base64");
    } catch (e) {
      return Response.json({ error: "Şəkil oxunmadı, yenidən cəhd edin" }, { status: 422 });
    }
  }

  if (!infoText && !imageBase64) {
    return Response.json({ error: "Şəkil və ya qısa məlumat göndərin" }, { status: 422 });
  }

  // Active categories for AI matching
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, nameAz: true, parentId: true },
  });
  const catLines = categories
    .map((c) => `- ${c.slug} (${c.nameAz})`)
    .join("\n");

  const prompt = `Sən FermerMarket.az aqrar bazarının məhsul analiz mütəxəssisisən. İstifadəçi məhsul şəkili və/və ya qısa məlumat göndərir, sən ondan tam elan hazırlayırsan. Azərbaycan dilində cavab ver.

İstifadəçinin qısa məlumatı: ${infoText || "(yoxdur, şəkildən analiz et)"}

Mövcud kateqoriyalar (slug formatında):
${catLines}

Şəkildə və məlumatdan görünən hər şeyi analiz et (marka, məhsul növü, tərkib, dozировка, ölçü və s.). Əgər qiymət, stok və ya toptan şərtlər məlum deyilsə, "missing" siyahısında konkret sual kimi qeyd et.

Yalnız bu JSON formatında cavab ver:
{
  "titleAz": "Qısa, satış yönlü başlıq (max 70 simvol, marka + məhsul növü)",
  "descriptionAz": "Peşəkar satış təsviri (150-400 simvol): məhsulun üstünlükləri, tətbiq qaydası, keyfiyyət vurğuları",
  "categorySlug": "yuxarıdakı siyahıdan ən uyğun kateqoriyanın slug-i",
  "unit": "ədəd/kq/litr/ton/paket/vedrə kimi uyğun satış vahidi",
  "price": "qiymət AZN rəqəm kimi string, məlum deyilsə null",
  "discountedPrice": "endirimli qiymət rəqəm kimi string, məlum deyilsə null",
  "wholesalePrice": "toptan qiymət rəqəm kimi string, məlum deyilsə null",
  "wholesaleMinQty": "toptan minimum say rəqəm kimi string, məlum deyilsə null",
  "stock": "stok sayı rəqəm kimi string, məlum deyilsə null",
  "missing": [
    { "field": "price", "question": "Məhsulun satış qiyməti nə qədərdir?" }
  ]
}
missing massivi yalnız çatışmayan məlumatlar üçün olmalıdır (price, stock, wholesalePrice, region, city ola bilər). Hamısı məlumdursa boş massiv qaytar.`;

  let aiText = "";
  try {
    const r = await geminiGenerate({
      prompt,
      imageBase64: imageBase64 || undefined,
      imageMimeType: imageBase64 ? imageMimeType : undefined,
      maxOutputTokens: 2048,
      jsonMode: true,
    });
    aiText = typeof r === "string" ? r : JSON.stringify(r);
  } catch (e) {
    return Response.json(
      { error: "AI analiz alınmadı: " + e.message + ". AI Ayarları bölməsində Gemini açarını yoxlayın." },
      { status: 502 }
    );
  }

  let draft = null;
  try {
    // Strip markdown code fences if the model still wraps the JSON in them.
    let cleaned = aiText.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    const candidate = m ? m[0] : cleaned;
    try {
      draft = JSON.parse(candidate);
    } catch {
      // Fallback: escape stray raw newlines/tabs that landed inside string
      // literals (common when the model ignores jsonMode on long descriptions).
      const sanitized = candidate.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (match, inner) =>
        '"' + inner.replace(/\r?\n/g, "\\n").replace(/\t/g, "\\t") + '"'
      );
      draft = JSON.parse(sanitized);
    }
  } catch (e) {
    console.log("⚠️ AI JSON parse xətası:", e.message, "| aiText:", aiText.slice(0, 500));
  }
  if (!draft) {
    return Response.json({ error: "AI cavabı oxunmadı, yenidən cəhd edin" }, { status: 502 });
  }

  // Resolve category slug → id (fallback: null → UI shows selector)
  const matched = categories.find((c) => c.slug === draft.categorySlug);
  return Response.json({
    _debug: { geminiError: geminiDebug.lastError, geminiStatus: geminiDebug.lastStatus },
    draft: {
      titleAz: draft.titleAz || "",
      descriptionAz: draft.descriptionAz || "",
      categorySlug: matched ? matched.slug : null,
      categoryId: matched ? matched.id : null,
      unit: draft.unit || "ədəd",
      price: draft.price || "",
      discountedPrice: draft.discountedPrice || "",
      wholesalePrice: draft.wholesalePrice || "",
      wholesaleMinQty: draft.wholesaleMinQty || "",
      stock: draft.stock || "",
    },
    missing: Array.isArray(draft.missing) ? draft.missing : [],
    categories: categories.map((c) => ({ id: c.id, slug: c.slug, name: c.nameAz })),
  });
}
