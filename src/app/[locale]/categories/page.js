import React from 'react';
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import Icon from '@/components/ui/Icon';
import SideBanner from "@/components/Banners/SideBanner";
import { getTranslations } from 'next-intl/server';

export const revalidate = 300;

export default async function CategoriesPage() {
  const t = await getTranslations('Home');

  const [categories, brands, stores, siteTextsList] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } }
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 16,
      include: { _count: { select: { products: { where: { status: 'ACTIVE' } } } } }
    }),
    prisma.store.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true, name: true, slug: true, logoUrl: true,
        isVerified: true, _count: { select: { products: true } }
      }
    }),
    prisma.siteText.findMany({ where: { isActive: true } }).catch(() => []),
  ]);

  const siteTextsMap = {};
  for (const item of siteTextsList || []) {
    siteTextsMap[item.key] = item.valueAz;
  }
  const st = (key, fallback) => siteTextsMap[key] || fallback;

  const gradients = [
    "from-emerald-500 to-green-600",
    "from-blue-500 to-indigo-600",
    "from-orange-400 to-red-500",
    "from-amber-400 to-orange-500",
    "from-purple-500 to-pink-600",
    "from-cyan-500 to-blue-600",
    "from-teal-400 to-emerald-500",
    "from-rose-400 to-red-500"
  ];

  const brandGradients = [
    "from-green-500 to-emerald-600",
    "from-blue-500 to-cyan-600",
    "from-purple-500 to-violet-600",
    "from-orange-400 to-amber-500",
    "from-rose-400 to-pink-500",
    "from-teal-500 to-green-600",
    "from-indigo-500 to-blue-600",
    "from-yellow-400 to-orange-500",
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-[1600px] mx-auto flex gap-4 px-4">

        {/* Left Ad Banner */}
        <SideBanner position="left" />

        {/* Main — Categories Grid */}
        <div className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Icon name="grid" size={24} className="text-green-600" />
              {st('products.allCategories', 'Bütün Kateqoriyalar')}
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all p-5 flex flex-col items-center gap-3 text-center"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon name="leaf" size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm leading-tight">{cat.nameAz || cat.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{cat._count.products} {st('products.productsCountLabel', 'məhsul')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR — Brands + Stores */}
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 gap-5 sticky top-20 self-start max-h-[calc(100vh-88px)] overflow-y-auto pr-1">

          {/* Brendlər Card */}
          {brands.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm">{st('products.popularBrands', 'Məşhur Brendlər')}</h3>
                <Link href="/brands" className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-0.5">
                  {st('products.viewAll', 'Hamısına bax')} <Icon name="arrowRight" size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {brands.map((brand, i) => (
                  <Link
                    key={brand.id}
                    href={`/brands/${brand.slug}`}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-gray-100 hover:border-green-400 hover:bg-green-50/50 transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${brandGradients[i % brandGradients.length]} flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-110 transition-transform`}>
                      {brand.logoUrl
                        ? <img src={brand.logoUrl} alt={brand.name} className="w-9 h-9 rounded-full object-cover" />
                        : brand.name[0]
                      }
                    </div>
                    <span className="text-xs font-semibold text-gray-700 truncate w-full text-center leading-tight">{brand.name}</span>
                    <span className="text-[10px] text-gray-400">{brand._count.products} {st('products.productsCountLabel', 'məhsul')}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Mağazalar Card */}
          {stores.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm">{st('products.popularStores', 'Məşhur Mağazalar')}</h3>
                <Link href="/stores" className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-0.5">
                  {st('products.viewAll', 'Hamısına bax')} <Icon name="arrowRight" size={12} />
                </Link>
              </div>
              <div className="space-y-1.5">
                {stores.map((store, i) => (
                  <Link
                    key={store.id}
                    href={`/stores/${store.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                      ['bg-blue-500','bg-indigo-500','bg-violet-500','bg-teal-500','bg-emerald-500'][i % 5]
                    }`}>
                      {store.logoUrl
                        ? <img src={store.logoUrl} alt={store.name} className="w-10 h-10 rounded-full object-cover" />
                        : store.name[0]
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1">
                        {store.name}
                        {store.isVerified && (
                          <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon name="check" size={10} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{store._count.products} {st('products.productsCountLabel', 'məhsul')}</div>
                    </div>
                    <Icon name="arrowRight" size={14} className="text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
