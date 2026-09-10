import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { geminiGenerate } from "@/lib/gemini";
import { SLOT_SIZES } from "@/lib/adSlotSizes";
import { mapProductImages } from "@/lib/imageUrl";

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapTitle(title, perLine, maxLines) {
  const words = String(title || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > perLine) { lines.push(cur.trim()); cur = w; if (lines.length >= maxLines) break; }
    else cur = (cur + " " + w).trim();
  }
  if (lines.length < maxLines && cur) lines.push(cur.trim());
  return lines.slice(0, maxLines);
}

/**
 * POST /api/admin/ai-creative { slotKey, productId }
 * Məhsulun fotoğrafı, adı və qiymətindən — seçilmiş slotun ÖLÇÜSÜNƏ
 * uyğun hazır reklam banneri (SVG) düzəldir. Copy AI ilə yazılır,
 * AI cavab verməsə məhsul adından avtomatik yaranır.
 */
export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role)) {
    return Response.json({ error: "Yalnız admin" }, { status: 403 });
  }
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Yanlış JSON" }, { status: 400 }); }

  const { slotKey, productId } = body;
  const size = SLOT_SIZES[slotKey];
  if (!size) return Response.json({ error: "Reklam yeri (slot) seçilməlidir", details: { slotKey: Object.keys(SLOT_SIZES) } }, { status: 422 });
  if (!productId) return Response.json({ error: "Məhsul seçilməlidir" }, { status: 422 });

  const product = mapProductImages(await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true, store: { select: { name: true } } },
  }));
  if (!product) return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });

  const price = Number(product.discountedPrice ?? product.price ?? 0).toFixed(2);
  const oldPrice = product.discountedPrice ? Number(product.price).toFixed(2) : null;
  const imgUrl = product.images?.[0]?.url;
  const absoluteImg = imgUrl && imgUrl.startsWith("/") ? `https://www.fermermarket.az${imgUrl}` : imgUrl;

  // AI copy — qısa reklam başlığı
  let headline = null, subline = null, aiUsed = false;
  try {
    const ai = await geminiGenerate({
      prompt: `"${product.titleAz}" adlı kənd təsərrüfatı məhsulu üçün QISA, sərt, diqqətçəkən Azərbaycan dilində reklam başlığı yaz (maks 6 söz) və bir sətirlik alt mətn (maks 10 söz). JSON: {"headline":"...","subline":"..."}`,
      jsonMode: true,
      maxOutputTokens: 256,
    });
    const m = ai && ai.match(/\{[\s\S]*\}/);
    if (m) {
      const p = JSON.parse(m[0]);
      if (p.headline) { headline = String(p.headline).slice(0, 60); subline = p.subline ? String(p.subline).slice(0, 90) : null; aiUsed = true; }
    }
  } catch {}
  if (!headline) headline = String(product.titleAz || "").slice(0, 50);

  const { w, h } = size;
  const narrow = w < 250;                 // 160x600 sidebar
  const strip = h <= 120;                 // footer strip
  const big = w >= 700;                   // homepage top

  // Layout parametrləri
  const titleLines = wrapTitle(headline, narrow ? 14 : big ? 26 : 18, narrow ? 4 : strip ? 1 : 2);
  const pad = strip ? 16 : 18;
  const titleSize = strip ? 34 : narrow ? 21 : big ? 40 : 28;
  const priceSize = strip ? 26 : narrow ? 26 : big ? 44 : 34;
  const storeName = product.store?.name || "FermerMarket";

  let imgBlock = "";
  if (absoluteImg) {
    if (strip) {
      imgBlock = `<image href="${esc(absoluteImg)}" x="${w - h - pad + 10}" y="${pad - 8}" width="${h + 16}" height="${h + 16}" preserveAspectRatio="xMidYMid slice" style="clip-path:inset(0 round 14px)" />`;
    } else if (narrow) {
      imgBlock = `<image href="${esc(absoluteImg)}" x="0" y="0" width="${w}" height="${w}" preserveAspectRatio="xMidYMid slice" />`;
    } else {
      const iw = Math.min(Math.round(w * 0.38), 340);
      imgBlock = `<image href="${esc(absoluteImg)}" x="${w - iw - pad}" y="${h - iw - pad}" width="${iw}" height="${iw}" preserveAspectRatio="xMidYMid slice" style="clip-path:inset(0 round 16px)" opacity="0.95" />`;
    }
  }

  const titleBlock = titleLines.map((ln, i) =>
    `<text x="${pad}" y="${strip ? h / 2 + 10 : pad + (narrow ? (absoluteImg ? w + 30 : 24) : 52) + i * (titleSize + 6)}" font-size="${titleSize}" font-weight="800" fill="#ffffff" font-family="Arial, sans-serif">${esc(ln)}</text>`
  ).join("");

  const subY = strip ? h / 2 + 34 : pad + (narrow ? (absoluteImg ? w + 30 : 24) : 52) + titleLines.length * (titleSize + 6) + 6;
  const sublineBlock = (subline && !strip) ? `<text x="${pad}" y="${subY}" font-size="${narrow ? 11 : 14}" fill="#bbf7d0" font-family="Arial, sans-serif">${esc(subline)}</text>` : "";

  const priceY = narrow ? h - 66 : h - pad - 6;
  const oldPriceBlock = oldPrice
    ? `<text x="${pad}" y="${priceY}" font-size="${narrow ? 12 : 16}" fill="#a3e3c3" text-decoration="line-through" font-family="Arial, sans-serif">${esc(oldPrice)} ₼</text>
       <text x="${narrow ? pad : pad + (oldPrice.length * (narrow ? 7 : 10) + 14)}" y="${priceY - (narrow ? 22 : 28)}" font-size="${priceSize}" font-weight="900" fill="#ffffff" font-family="Arial, sans-serif">${esc(price)} ₼</text>`
    : `<text x="${pad}" y="${priceY - (narrow ? 22 : 28)}" font-size="${priceSize}" font-weight="900" fill="#ffffff" font-family="Arial, sans-serif">${esc(price)} ₼</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#166534"/>
      <stop offset="0.55" stop-color="#16a34a"/>
      <stop offset="1" stop-color="#065f46"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${narrow ? w * 0.8 : w * 0.92}" cy="${strip ? h / 2 : h * 0.18}" r="${Math.round(Math.min(w, h) * 0.45)}" fill="#ffffff" opacity="0.07"/>
  ${imgBlock}
  <text x="${pad}" y="${strip ? h / 2 - 18 : pad + 14}" font-size="${narrow ? 9 : strip ? 14 : 12}" font-weight="700" fill="#dcfce7" letter-spacing="1.5" font-family="Arial, sans-serif">${esc(storeName.toUpperCase())}</text>
  ${titleBlock}
  ${sublineBlock}
  ${priceY > 0 ? `<rect x="${pad}" y="${narrow ? h - 46 : h - pad - 12}" width="${narrow ? w - 2 * pad : Math.min(w - 2 * pad, 130)}" height="${narrow ? 30 : 36}" rx="18" fill="#ffffff"/>` : ""}
  ${priceY > 0 ? `<text x="${pad + (narrow ? (w - 2 * pad) / 2 : Math.min(w - 2 * pad, 130) / 2)}" y="${narrow ? h - 26 : h - pad + 12}" text-anchor="middle" font-size="${narrow ? 11 : 14}" font-weight="800" fill="#166534" font-family="Arial, sans-serif">İNDİ BAX →</text>` : ""}
  ${priceY > 0 ? oldPriceBlock : ""}
</svg>`;

  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return Response.json({
    dataUri,
    slot: { key: slotKey, ...size },
    headline, subline, aiUsed,
    debug: { price, oldPrice },
  });
}
