import { prisma } from '@/lib/prisma';
import { routing } from '@/i18n/routing';

export default async function sitemap() {
  try {
    // Use VERCEL_URL if NEXT_PUBLIC_SITE_URL is not set
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://fermermarket.az");
    const locales = routing.locales;

    // Get active products
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    });

    // Get active categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    // Get active stores
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const blogs = await prisma.blogPost.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }); 
    const allUrls = [];

    for (const locale of locales) {
      const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;

      const productUrls = products.map((p) => ({
        url: `${baseUrl}${localePrefix}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      }));

      const blogUrls = blogs.map(b => ({ url: `${baseUrl}${localePrefix}/blog/${b.slug}`, lastModified: b.updatedAt, changeFrequency: 'daily', priority: 0.8 }));

      const categoryUrls = categories.map((c) => ({
        url: `${baseUrl}${localePrefix}/products?category=${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      }));

      const storeUrls = stores.map((s) => ({
        url: `${baseUrl}${localePrefix}/stores/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }));

      allUrls.push(
        {
          url: `${baseUrl}${localePrefix}`,
          lastModified: new Date(),
          changeFrequency: "hourly",
          priority: 1.0,
        },
        {
          url: `${baseUrl}${localePrefix}/products`,
          lastModified: new Date(),
          changeFrequency: "hourly",
          priority: 0.9,
        },
        {
          url: `${baseUrl}${localePrefix}/stores`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.8,
        },
        ...categoryUrls,
        ...storeUrls,
        ...productUrls,
        ...blogUrls
      );
    }

    return allUrls;
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return [];
  }
}

export const dynamic = "force-dynamic";
