import React from 'react';
import { redirect } from 'next/navigation';
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import Icon from '@/components/ui/Icon';
import SideBanner from "@/components/Banners/SideBanner";

export async function generateMetadata({ params }) {
  const p = await params;
  const { slug } = p;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: 'Kateqoriya Tapılmadı' };
  return {
    title: `${category.nameAz} | FermerMarket`,
  };
}

export default async function CategorySubcategoryPage({ params }) {
  const p = await params;
  const { slug, locale } = p;

  const [category, siteTextsList] = await Promise.all([
    prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { products: true }
            }
          }
        }
      }
    }),
    prisma.siteText.findMany({ where: { isActive: true } }).catch(() => []),
  ]);

  if (!category) {
    redirect("/categories");
  }

  // If it's a leaf node, redirect to products page
  if (category.children.length === 0) {
    redirect(`/products?category=${slug}`);
  }

  const siteTextsMap = {};
  for (const item of siteTextsList || []) {
    siteTextsMap[item.key] = item.valueAz;
  }
  const st = (key, fallback) => siteTextsMap[key] || fallback;

  const iconMap = {
    'Bitki Mühafizə': 'bug',
    'Gübrələr': 'sprout',
    'Toxum və Ting': 'leaf',
    'Aqrotexnika': 'tractor',
    'Suvarma': 'droplets',
    'Alət və Avadanlıqlar': 'hammer',
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-[1600px] mx-auto flex gap-6 px-4">
        <SideBanner position="left" />
        <div className="flex-1 min-w-0 w-full">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8">
              <Link href="/categories" className="text-sm text-brand-600 hover:underline mb-2 inline-block">
                <span className="flex items-center gap-1.5"><Icon name="arrowLeft" size={16} /> {st('products.allCategories', 'Bütün Kateqoriyalar')}</span>
              </Link>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                {category.nameAz} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-green-400">{st('products.subcategoriesSuffix', 'Alt Kateqoriyaları')}</span>
              </h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {category.children.map((child, index) => {
                const iconName = child.icon || iconMap[child.nameAz] || 'box';
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
                const bgGradient = gradients[index % gradients.length];

                return (
                  <Link 
                    key={child.id} 
                    href={`/categories/${child.slug}`} 
                    className="group block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1"
                  >
                    <div className={`h-24 bg-gradient-to-r ${bgGradient} relative overflow-hidden`}>
                      <div className="absolute right-4 top-4 text-white/20 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        <Icon name={iconName} size={80} />
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                    <div className="p-6 relative">
                      <div className={`w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-gray-800 -mt-12 mb-4 relative z-10 border border-gray-100 group-hover:text-brand-600 transition-colors`}>
                        <Icon name={iconName} size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{child.nameAz}</h3>
                      <div className="flex items-center justify-between text-gray-500 text-sm">
                        <span className="flex items-center gap-1"><Icon name="package" size={16} /> {child._count?.products || 0} {st('products.productsCountLabel', 'məhsul')}</span>
                        <span className="text-brand-600 font-bold group-hover:translate-x-1 transition-transform"><Icon name="arrowRight" size={16} /></span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <SideBanner position="right" />
      </div>
    </div>
  );
}
