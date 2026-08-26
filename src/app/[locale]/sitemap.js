import { prisma } from "@/lib/prisma";

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://fermermarket.az";

  let products = [];
  let categories = [];

  try {
    const [p, c] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    products = p;
    categories = c;
  } catch (err) {
    console.warn("⚠️ Sitemap: Verilənlər bazası qoşulması alınmadı (Lokal/Sərbəst rejimdə yığım davam edir)");
  }

  const staticRoutes = ["", "/products", "/agronom", "/login", "/register"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  const productRoutes = products.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${base}/products?category=${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
