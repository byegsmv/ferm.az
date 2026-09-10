import { prisma } from "@/lib/prisma";

// GET /api/merchant-feed — Google Merchant Center (Google Shopping) XML feed
// Qeydiyyat: Merchant Center → Products → Feeds → Scheduled fetch
// URL: https://www.fermermarket.az/api/merchant-feed
// Ölkə: Azerbaijan, Dil: az, Valyuta: AZN
export async function GET() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", price: { gt: 0 } },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 5 },
      brand: { select: { name: true } },
      store: { select: { name: true } },
      category: { select: { nameAz: true } },
    },
    take: 2000,
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.fermermarket.az";
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  const imgUrl = (u) => {
    if (!u) return null;
    return u.startsWith("http") ? u : `${base}${u}`;
  };

  const items = products
    .map((p) => {
      const link = `${base}/az/products/${p.slug}`;
      const mainImg = imgUrl(p.images[0]?.url);
      if (!mainImg) return null; // Google üçün şəkilsiz məhsul qəbul edilmir
      const additionalImgs = p.images.slice(1).map((i) => imgUrl(i.url)).filter(Boolean);
      const effectivePrice = p.discountedPrice && Number(p.discountedPrice) > 0 ? p.discountedPrice : p.price;
      const availability = p.stock > 0 ? "in_stock" : "out_of_stock";
      const brandName = p.brand?.name || p.manufacturer || p.store?.name || "FermerMarket";
      let item = `    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.titleAz)}</g:title>
      <g:description>${esc(p.descriptionAz || `${p.titleAz} — FermerMarket MMC-dən sifariş edin.`)}</g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${esc(mainImg)}</g:image_link>`;
      additionalImgs.forEach((ai) => {
        item += `
      <g:additional_image_link>${esc(ai)}</g:additional_image_link>`;
      });
      item += `
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${Number(effectivePrice).toFixed(2)} AZN</g:price>
      <g:brand>${esc(brandName)}</g:brand>`;
      if (p.productCode) item += `
      <g:mpn>${esc(p.productCode)}</g:mpn>`;
      if (p.barcode) item += `
      <g:gtin>${esc(p.barcode)}</g:gtin>`;
      item += `
      <g:google_product_category>${esc(p.category?.nameAz || "Agriculture")}</g:google_product_category>
      <g:identifier_exists>${p.productCode || p.barcode ? "yes" : "no"}</g:identifier_exists>
    </item>`;
      return item;
    })
    .filter(Boolean);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>FermerMarket MMC — Məhsullar</title>
    <link>${base}</link>
    <description>FermerMarket MMC kənd təsərrüfatı məhsulları kataloqu</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
