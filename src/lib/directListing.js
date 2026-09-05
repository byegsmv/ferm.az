import { prisma } from "@/lib/prisma";
import { geminiGenerate } from "@/lib/gemini";
import slugify from "slugify";

// ─────────────────────────────────────────────────────────────────────────────
// AI Aqronom direct-listing flow
// A logged-in staff member sends a product photo + short info text in the
// AI Aqronom chat. Gemini extracts a full draft, the product is published
// instantly (ACTIVE) into the user's store (or the store named in the text).
// ─────────────────────────────────────────────────────────────────────────────

export function looksLikeListingIntent(text) {
  const t = (text || "").toLowerCase();
  // Explicit price mentions: "130 azn", "qiymət 25", "130/120", "25₼"
  const priceRe = /(\d+([.,]\d+)?\s*(azn|₼|manat))|qiym[eə]t|(\d+\s*\/\s*\d+)/i;
  // Add/publish keywords
  const addRe = /(əlav[əa] e[dt]|yerl[eə]şdir|yayımla|satışa qoy|mağazaya|elan (ver|yerləşdir)|toplu yükl[əa]|məhsulu qoy)/i;
  return priceRe.test(t) || addRe.test(t);
}

// Gemini jsonMode analysis → product draft
export async function extractListingDraft({ infoText, imageBase64, imageMimeType }) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, nameAz: true },
  });
  const catLines = categories.map((c) => `- ${c.slug} (${c.nameAz})`).join("\n");

  const prompt = `Sən FermerMarket.az aqrar bazarının məhsul analiz mütəxəssisisən. İstifadəçi məhsulun şəklini və/və ya qısa məlumat göndərir (çox vaxt WhatsApp tərzi qısa yazı, məsələn: "EvroHim KAS-32 maye azot gübrəsi, 3.50 AZN, toptan 2.80 min 10 ədəd" və ya "130/120 min 5"). Sən bunlardan tam satış elanı hazırlayırsan.

QIYMƏT QAYDALARI (çox vacibdir):
- "3.50 AZN" kimi tək qiymət varsa → price=3.50 (pərakəndə).
- "130/120" kimi iki rəqəm varsa → price=130 (pərakəndə), wholesalePrice=120 (toptan), adətən yanındakı "min 5" = wholesaleMinQty=5.
- "Pərakəndə—170, Topdan—160" → price=170, wholesalePrice=160.
- Toptan qiymət varsa, wholesaleMinQty mütləq rəqəm olmalıdır (yazılmayıbsa 5 qəbul et).

İstifadəçinin qısa məlumatı: ${infoText || "(yoxdur, şəkildən analiz et)"}

Mövcud kateqoriyalar (slug):
${catLines}

Şəkildə görünən hər şeyi analiz et: marka, məhsul növü (insektisid/fungisid/gübrə və s.), tərkib, qablaşdırma ölçüsü, aktiv maddə. Qablaşdırma ölçüsü başlığın sonunda mötərizədə yazılır: "(1 Litr)", "(25 Kq)", "(20 Litr)". Satış vahidi demək olar hamısı üçün "ədəd"dir.

Əgər istifadəçinin mesajında "(Əvvəlki AI hazırlığı: ...)" hissəsi varsa, onu əsas qəbul et və yeni cavabla tamamla, şəkli yenidən analiz etmə.

Yalnız bu JSON formatında cavab ver:
{
  "titleAz": "Marka + məhsul növü + qablaşdırma (max 70 simvol)",
  "descriptionAz": "Peşəkar satış təsviri (150-400 simvol)",
  "categorySlug": "yuxarıdakı siyahıdan ən uyğun slug",
  "unit": "ədəd",
  "price": "pərakəndə qiymət AZN string, məlum deyilsə null",
  "wholesalePrice": "toptan qiymət string, yoxdursa null",
  "wholesaleMinQty": "toptan minimum say string, yoxdursa null",
  "stock": "stok sayı string, məlum deyilsə 50",
  "missing": [
    { "field": "price", "question": "Məhsulun satış qiyməti nə qədərdir?" }
  ]
}
missing massivi yalnız çatışmayan məlumatlar üçündür (price, stock ola bilər). Hamısı məlumdursa boş massiv qaytar.`;

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
    throw new Error("AI analiz alınmadı: " + e.message);
  }

  let draft = null;
  try {
    let cleaned = aiText.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    const candidate = m ? m[0] : cleaned;
    try {
      draft = JSON.parse(candidate);
    } catch {
      const sanitized = candidate.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (match, inner) =>
        '"' + inner.replace(/\r?\n/g, "\\n").replace(/\t/g, "\\t") + '"'
      );
      draft = JSON.parse(sanitized);
    }
  } catch {
    draft = null;
  }
  // Offline/simulated fallback responses never contain a usable draft
  if (!draft || typeof draft !== "object" || !(draft.titleAz || "").trim()) {
    throw new Error("AI cavabı oxunmadı. AI Ayarları bölməsində Gemini açarını yoxlayın.");
  }

  const matched = categories.find((c) => c.slug === draft.categorySlug);
  return {
    draft: {
      titleAz: (draft.titleAz || "").trim(),
      descriptionAz: draft.descriptionAz || "",
      categorySlug: matched ? matched.slug : null,
      categoryId: matched ? matched.id : null,
      unit: draft.unit || "ədəd",
      price: draft.price || "",
      wholesalePrice: draft.wholesalePrice || "",
      wholesaleMinQty: draft.wholesaleMinQty || "",
      stock: draft.stock || "50",
    },
    missing: Array.isArray(draft.missing) ? draft.missing : [],
  };
}

// Resolve which store the listing should go to.
// Priority: store named in the text → user's only store → ask.
export async function resolveTargetStore(userId, text) {
  const stores = await prisma.store.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true, slug: true, ownerId: true },
    orderBy: { createdAt: "asc" },
  });
  if (stores.length === 0) return { store: null, stores: [] };
  const t = (text || "").toLowerCase();
  const named = stores.find((s) => s.name && t.includes(s.name.toLowerCase().slice(0, 12)));
  if (named) return { store: named, stores };
  if (stores.length === 1) return { store: stores[0], stores };
  return { store: null, stores };
}

// Create the product exactly like the bulk-upload module does (staff → ACTIVE).
export async function createListingFromDraft({ draft, store, sellerId, imageDataUri }) {
  const title = (draft.titleAz || "").trim();
  if (title.length < 3) throw new Error("Başlıq çox qısadır");
  const price = Number(draft.price);
  if (!(price > 0)) throw new Error("Qiymət müsbət olmalıdır");
  if (!draft.categoryId) throw new Error("Kateqoriya tapılmadı");

  const stock = Number(draft.stock) > 0 ? parseInt(draft.stock, 10) : 50;
  let wholesalePrice = null;
  let wholesaleMinQty = null;
  if (Number(draft.wholesalePrice) > 0) {
    wholesalePrice = Number(draft.wholesalePrice);
    wholesaleMinQty = parseInt(draft.wholesaleMinQty || "5", 10) || 5;
  }

  const baseSlug = slugify(title, { lower: true, strict: true }) || "mehsul";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 10)}`;

  const created = await prisma.product.create({
    data: {
      titleAz: title,
      descriptionAz: draft.descriptionAz || null,
      price,
      stock,
      unit: draft.unit || "ədəd",
      categoryId: draft.categoryId,
      sellerId,
      ...(store ? { storeId: store.id } : {}),
      ...(wholesalePrice ? { wholesalePrice, wholesaleMinQty, isCorporate: true } : {}),
      allowRetail: true,
      slug,
      status: "ACTIVE",
    },
  });

  if (imageDataUri) {
    await prisma.productImage.create({
      data: { productId: created.id, url: imageDataUri, altText: title, sortOrder: 0 },
    });
  }
  return { ...created, wholesalePrice, wholesaleMinQty };
}
