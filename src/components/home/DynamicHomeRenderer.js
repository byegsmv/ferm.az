"use client";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/ui/Icon";
import HeroSlider from "@/components/home/HeroSlider";
import PromoSlider from "@/components/home/PromoSlider";
import StatsSection from "@/components/home/StatsSection";
import BlogSection from "@/components/home/BlogSection";
import BundleCard from "@/components/BundleCard";
import AdBanner from "@/components/AdBanner";
import CategoriesSlider from "@/components/home/CategoriesSlider";
import BrandsSlider from "@/components/home/BrandsSlider";
import StoresSlider from "@/components/home/StoresSlider";
export default function DynamicHomeRenderer({ initialBlocks, homeData, editMode }) {
  const [blocks, setBlocks] = useState(initialBlocks);

  useEffect(() => {
    if (!editMode) return;
    const handleMessage = (e) => {
      if (e.data?.type === "FMK_LIVE_UPDATE") {
        setBlocks(e.data.blocks);
      } else if (e.data?.type === "FMK_RELOAD_BLOCKS") {
        window.location.reload();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [editMode]);

  const onBlockClick = (index, e) => {
    if (editMode) {
      e.stopPropagation();
      e.preventDefault();
      window.parent.postMessage({ type: "FMK_BLOCK_CLICK", index }, "*");
    }
  };

  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className={`pb-28 md:pb-12 ${editMode ? "p-3 sm:p-4" : ""}`}>
      {blocks.map((block, index) => {
        const p = block.props || {};
        let content = null;

        if (block.type === "HERO_SLIDER") {
          content = <HeroSlider />;
        } else if (block.type === "CATEGORIES") {
          content = (
            <CategoriesSlider
              categories={homeData?.categories?.slice(0, p.count || 20)}
              title={p.title}
              subtitle={p.subtitle}
            />
          );
        } else if (block.type === "BRANDS") {
          content = (
            <BrandsSlider
              brands={homeData?.brands?.slice(0, p.count || 15)}
              title={p.title}
              subtitle={p.subtitle}
            />
          );
        } else if (block.type === "STORES") {
          content = (
            <StoresSlider
              stores={homeData?.stores?.slice(0, p.count || 15)}
              title={p.title}
              subtitle={p.subtitle}
            />
          );
        } else if (block.type === "PREMIUM_ADS") {
          if (!homeData?.premiumListings?.length) return null;
          content = (
            <section className="max-w-6xl mx-auto px-3 sm:px-4 mt-8 sm:mt-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500">
                      <Icon name="star" size={18} />
                    </div>
                    {p.title || "Premium Elanlar"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">{p.subtitle || "Önə çıxan elanlar"}</p>
                </div>
                <Link href="/products?tier=premium" className="text-xs sm:text-sm text-brand-600 font-semibold hover:text-brand-700">
                  <span className="flex items-center gap-1">Hamısı <Icon name="arrowRight" size={14} /></span>
                </Link>
              </div>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4 scroll-snap-x">
                {homeData.premiumListings.map((l) => (
                  <div key={l.id} className="scroll-snap-item shrink-0 w-40 sm:w-48 md:w-52">
                    <ProductCard
                      tier={l.tier}
                      product={{
                        ...l.product,
                        id: l.product?.id || l.id,
                        title: l.product?.titleAz || "Elan",
                        price: Number(l.product?.price || 0),
                        discountedPrice: l.product?.discountedPrice ? Number(l.product.discountedPrice) : null,
                        coverImage: Array.isArray(l.product?.images) && l.product.images.length > 0 ? l.product.images[0]?.url : null,
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        } else if (block.type === "LATEST_ADS") {
          content = (
            <section className="max-w-6xl mx-auto px-3 sm:px-4 mt-8 sm:mt-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                      <Icon name="tag" size={18} />
                    </div>
                    {p.title || "Yeni Elanlar"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">{p.subtitle || "Ən son əlavə edilmiş məhsullar"}</p>
                </div>
                <Link href="/products" className="text-xs sm:text-sm text-brand-600 font-semibold hover:text-brand-700">
                  <span className="flex items-center gap-1">Hamısı <Icon name="arrowRight" size={14} /></span>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {homeData?.latestProducts?.slice(0, p.count || 8).map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={{
                      ...prod,
                      title: prod.titleAz || "Elan",
                      price: Number(prod.price || 0),
                      discountedPrice: prod.discountedPrice ? Number(prod.discountedPrice) : null,
                      coverImage: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0]?.url : null,
                    }}
                  />
                ))}
              </div>
            </section>
          );
        } else if (block.type === "BUNDLES") {
          if (!homeData?.bundles?.length) return null;
          content = (
            <section className="max-w-6xl mx-auto px-3 sm:px-4 mt-8 sm:mt-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Icon name="package" size={18} />
                </div>
                {p.title || "Bağlamalar"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {homeData.bundles.map((b) => <BundleCard key={b.id} bundle={b} />)}
              </div>
            </section>
          );
        } else if (block.type === "BLOG") {
          if (!homeData?.blogPosts?.length) return null;
          content = <div className="max-w-6xl mx-auto px-4 mt-10"><BlogSection posts={homeData.blogPosts} /></div>;
        } else if (block.type === "CAMPAIGNS") {
          if (!homeData?.campaigns?.length) return null;
          content = (
            <section className="max-w-6xl mx-auto px-3 sm:px-4 mt-8 sm:mt-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                      <Icon name="megaphone" size={18} />
                    </div>
                    {p.title || "Kampaniyalar"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">{p.subtitle || "Aktiv kampaniya və endirimlər"}</p>
                </div>
                <Link href="/campaigns" className="text-xs sm:text-sm text-brand-600 font-semibold hover:text-brand-700">
                  <span className="flex items-center gap-1">Hamısı <Icon name="arrowRight" size={14} /></span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {homeData.campaigns.map((campaign) => {
                  const daysLeft = Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                  const getBgColors = (type) => {
                    switch(type) {
                      case 'FLASH_SALE': return 'from-orange-400 to-red-500';
                      case 'DAILY_DEAL': return 'from-blue-500 to-indigo-600';
                      default: return 'from-brand-500 to-green-600';
                    }
                  };
                  return (
                    <Link
                      key={campaign.id}
                      href={campaign.targetUrl || "/campaigns"}
                      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                    >
                      <div className="relative h-36 bg-gray-100 overflow-hidden">
                        {campaign.bannerUrl ? (
                          <img src={campaign.bannerUrl} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${getBgColors(campaign.type)}`}></div>
                        )}
                        {daysLeft > 0 && daysLeft <= 7 && (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-0.5 rounded-full text-red-600">
                            {daysLeft} gün qaldı
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900">{campaign.title}</h3>
                        {campaign.store && (
                          <p className="text-xs text-gray-500 mt-1">{campaign.store.name}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        } else if (block.type === "AD_BANNER") {
          if (!homeData?.homepageAd) return null;
          content = <div className="max-w-6xl mx-auto px-4 mt-10"><AdBanner content={homeData.homepageAd} /></div>;
        } else {
          content = <div className="p-10 bg-gray-100 text-center rounded-2xl mx-4 mt-10">Bilinməyən modul: {block.type}</div>;
        }

        return (
          <div 
            key={index} 
            onClick={(e) => onBlockClick(index, e)}
            className={`${editMode ? 'relative cursor-pointer ring-2 ring-transparent hover:ring-brand-500 rounded-3xl transition group' : ''}`}
          >
            {editMode && (
              <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/10 rounded-3xl z-10 flex items-center justify-center transition pointer-events-none">
                <span className="opacity-0 group-hover:opacity-100 bg-brand-600 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-xl pointer-events-auto">
                  Redaktə et ({block.type})
                </span>
              </div>
            )}
            {content}
          </div>
        );
      })}
    </div>
  );
}
