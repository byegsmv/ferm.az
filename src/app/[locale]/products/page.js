import { Fragment, Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { Link } from "@/i18n/routing";
import AdBanner from "@/components/AdBanner";
import { getAdSlotContent } from "@/lib/adSlots";
import { resolveCategorySlugs } from "@/lib/categoryFilter";
import AdvancedFilterSidebar from "@/components/products/AdvancedFilterSidebar";
import SideBanner from "@/components/Banners/SideBanner";
import Icon from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

function getPageWindow(current, total, delta = 1) {
  const pages = [];
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }
  pages.push(1);
  if (range[0] > 2) pages.push("…");
  pages.push(...range);
  if (range[range.length - 1] < total - 1) pages.push("…");
  if (total > 1) pages.push(total);
  return pages;
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const search = sp?.search;
  return {
    title: search ? `"${search}" üzrə axtarış nəticələri` : "Bütün Elanlar",
    description: search
      ? `${search} üzrə FermerMarket elanları — mal-qara, gübrə, texnika və digər kənd təsərrüfatı məhsulları.`
      : "FermerMarket-də bütün aktiv elanlar: mal-qara, gübrə, toxum, texnika, bal və daha çoxu.",
  };
}

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const { 
    category, search, minPrice, maxPrice, region, page, sort, 
    isCorporate, isOrganic, tags
  } = sp || {};
  
  const pageNum = Math.max(1, parseInt(page || "1", 10));
  const pageSize = 20;

  const categorySlugs = await resolveCategorySlugs(category);

  const where = {
    status: "ACTIVE",
    ...(region ? { region } : {}),
    ...(categorySlugs ? { category: { slug: { in: categorySlugs } } } : {}),
    ...(minPrice || maxPrice
      ? { price: { ...(minPrice ? { gte: Number(minPrice) } : {}), ...(maxPrice ? { lte: Number(maxPrice) } : {}) } }
      : {}),
    ...(search
      ? {
          OR: [
            { titleAz: { contains: search, mode: "insensitive" } },
            { descriptionAz: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
            { productCode: { contains: search, mode: "insensitive" } },
            {
              activeIngredients: {
                some: {
                  ingredient: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { nameAz: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            },
            {
              diseases: {
                some: {
                  disease: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { nameAz: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            },
            {
              pests: {
                some: {
                  pest: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { nameAz: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            },
            {
              crops: {
                some: {
                  crop: {
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { nameAz: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {}),
    // YENİ FİLTRLƏR:
    ...(isCorporate === "true" ? { isCorporate: true } : isCorporate === "false" ? { isCorporate: false } : {}),
    ...(isOrganic === "true" ? { isOrganic: true } : {}),
    ...(tags ? { tags: { hasSome: tags.split(',').map(t => t.trim()).filter(Boolean) } } : {}),
  };

  let total = 0, products = [], categories = [], topAd = null, infeedAd = null, siteTextsList = [];
  let isFallback = false;

  try {
    [total, products, categories, topAd, infeedAd, siteTextsList] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: (() => {
          if (sort === "price_asc") return { price: "asc" };
          if (sort === "price_desc") return { price: "desc" };
          if (sort === "oldest") return { createdAt: "asc" };
          return { createdAt: "desc" };
        })(),
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { images: { take: 1 }, category: true, store: { select: { name: true, slug: true, isVerified: true } } },
      }),
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        include: { 
          children: { 
            where: { isActive: true }, 
            orderBy: { sortOrder: "asc" },
            include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } }
          } 
        },
      }),
      getAdSlotContent("PRODUCT_LIST_TOP", { region }),
      getAdSlotContent("PRODUCT_LIST_INFEED", { region }),
      prisma.siteText.findMany({ where: { isActive: true } }).catch(() => []),
    ]);

    // Fallback logic
    if (products.length === 0 && category && (!search && !minPrice && !maxPrice)) {
      const mainCategory = await prisma.category.findUnique({ where: { slug: category }, select: { id: true } });
      if (mainCategory) {
        const categoryId = mainCategory.id;
        const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { parentId: true } });
        if (cat?.parentId) {
          const siblings = await prisma.category.findMany({ where: { parentId: cat.parentId }, select: { id: true } });
          const siblingIds = siblings.map(s => s.id);
          products = await prisma.product.findMany({
            where: { status: 'ACTIVE', categoryId: { in: siblingIds } },
            orderBy: { createdAt: 'desc' },
            take: 12,
            include: { images: { take: 1 }, category: true, store: { select: { name: true, slug: true, isVerified: true } } }
          });
          isFallback = true;
          total = products.length;
        }
      }
    }
  } catch (err) {
    console.error("ProductsPage DB error:", err.message);
  }

  const siteTextsMap = {};
  for (const st of siteTextsList || []) {
    siteTextsMap[st.key] = st.valueAz;
  }
  const t = (key, fallback) => siteTextsMap[key] || fallback;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showFallbackBanner = isFallback;

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 flex gap-6 items-start">
        <SideBanner position="left" />
        <div className="flex-1 min-w-0 w-full flex flex-col md:flex-row gap-6 items-start">
        
        {/* Advanced Filter Sidebar */}
        <Suspense fallback={<div className="w-80 h-96 bg-white rounded-2xl animate-pulse" />}><AdvancedFilterSidebar categories={categories} /></Suspense>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full">
          <AdBanner content={topAd} className="mb-6" />

          {showFallbackBanner && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 mb-6">
              <Icon name="alert" size={18} className="shrink-0 text-amber-600" /> {t('products.fallbackCategoryNotice', 'Bu kateqoriyada dəqiq uyğun elan tapılmadı. Sizin üçün oxşar kateqoriyaların elanlarını göstəririk.')}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
            <h1 className="text-xl font-bold text-gray-900">
              {search ? `"${search}" ${t('products.searchResultsSuffix', 'üzrə nəticələr')}` : t('products.allListings', 'Bütün Elanlar')}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-100">
                {total} {t('products.listingsFound', 'elan tapıldı')}
              </span>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 sm:py-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center px-4">
              <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Icon name="search" size={32} strokeWidth={1.6} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('products.noProductsFound', 'Heç bir elan tapılmadı')}</h2>
              <p className="text-gray-500 max-w-sm mb-6">{t('products.noProductsFoundDesc', 'Axtarış şərtlərinizə uyğun nəticə yoxdur. Zəhmət olmasa filtrləri dəyişərək yenidən yoxlayın.')}</p>
              <a href="/products" className="btn-primary px-8">{t('products.resetFilters', 'Filtrləri Sıfırla')}</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {products.map((p, i) => (
                <Fragment key={p.id}>
                  <ProductCard product={{ id: p.id, slug: p.slug, title: p.titleAz, titleAz: p.titleAz, price: Number(p.price), coverImage: p.images[0]?.url || p.images?.[0]?.url, region: p.region, city: p.city, isCorporate: p.isCorporate, tags: p.tags }} />
                  {infeedAd && i === 7 && (
                    <div key="infeed-ad" className="col-span-2 md:col-span-2 lg:col-span-3 xl:col-span-4">
                      <AdBanner content={infeedAd} label={t('products.sponsoredLabel', 'Sponsorlu')} imgClassName="w-full h-40 md:h-48 object-cover rounded-2xl" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}

          {!isFallback && totalPages > 1 && (
            <div className="flex justify-center items-center flex-wrap gap-1.5 sm:gap-2 mt-8 sm:mt-10">
              <Link
                href={{ pathname: "/products", query: { ...sp, page: Math.max(1, pageNum - 1) } }}
                aria-disabled={pageNum === 1}
                className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold border transition-all ${
                  pageNum === 1
                    ? "pointer-events-none opacity-40 bg-white border-gray-200 text-gray-400"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <Icon name="arrowLeft" size={16} />
              </Link>

              {getPageWindow(pageNum, totalPages).map((n, idx) =>
                n === "…" ? (
                  <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400 select-none">…</span>
                ) : (
                  <Link
                    key={n}
                    href={{ pathname: "/products", query: { ...sp, page: n } }}
                    aria-current={n === pageNum ? "page" : undefined}
                    className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                      n === pageNum
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-200"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    {n}
                  </Link>
                )
              )}

              <Link
                href={{ pathname: "/products", query: { ...sp, page: Math.min(totalPages, pageNum + 1) } }}
                aria-disabled={pageNum === totalPages}
                className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold border transition-all ${
                  pageNum === totalPages
                    ? "pointer-events-none opacity-40 bg-white border-gray-200 text-gray-400"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          )}
        </div>
        </div>
        <SideBanner position="right" />
      </div>
    </div>
  );
}
