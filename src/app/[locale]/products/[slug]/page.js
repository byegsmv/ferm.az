import Icon from "@/components/ui/Icon";
import SafeImage from "@/components/SafeImage";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import WhatsAppButton from "@/components/WhatsAppButton";
import ContactSellerButton from "@/components/ContactSellerButton";
import AdBanner from "@/components/AdBanner";
import ProductCard from "@/components/ProductCard";
import { Link } from "@/i18n/routing";
import { getAdSlotContent } from "@/lib/adSlots";
import ProductReviews from "@/components/ProductReviews";
import ShareButtons from "@/components/ShareButtons";
import CompareButton from "@/components/CompareButton";
import ReportModal from "@/components/ReportModal";
import QuoteRequestModal from "@/components/QuoteRequestModal";
import CreditRequestModal from "@/components/CreditRequestModal";
import ProductPdfButtons from "@/components/ProductPdfButtons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getProduct(slug) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      seller: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          role: true,
          avgRating: true,
          reviewCount: true
        }
      },
      store: true,
      activeIngredients: { include: { ingredient: true } },
      diseases: { include: { disease: true } },
      pests: { include: { pest: true } },
      crops: { include: { crop: true } },
    },
  });
}

// Bottom-of-page discovery section:
// 1) other ACTIVE listings from the same category (if any exist)
// 2) otherwise fall back to VIP/premium listings, topped up with the latest listings
async function getRelatedProducts(product) {
  const sameCategory = await prisma.product.findMany({
    where: { status: "ACTIVE", categoryId: product.categoryId, id: { not: product.id } },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { images: { take: 1 }, category: true },
  });

  if (sameCategory.length > 0) {
    return { heading: "Bu kateqoriyada digər elanlar", items: sameCategory, tierById: {} };
  }

  const now = new Date();
  const [vipListings, latest] = await Promise.all([
    prisma.listing.findMany({
      where: { tier: { not: "STANDARD" }, OR: [{ endDate: null }, { endDate: { gt: now } }] },
      orderBy: [{ tier: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: { product: { include: { images: { take: 1 }, category: true } } },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", id: { not: product.id } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { images: { take: 1 }, category: true },
    }),
  ]);

  const tierById = {};
  const vipProducts = vipListings
    .filter((l) => l.product.id !== product.id)
    .map((l) => {
      tierById[l.product.id] = l.tier;
      return l.product;
    });

  const seen = new Set(vipProducts.map((p) => p.id));
  const combined = [...vipProducts];
  for (const p of latest) {
    if (!seen.has(p.id) && combined.length < 8) {
      seen.add(p.id);
      combined.push(p);
    }
  }

  return {
    heading: vipProducts.length > 0 ? "VIP elanlar və son əlavələr" : "Son əlavə olunan elanlar",
    items: combined,
    tierById,
  };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  
  if (!product || product.status === "DRAFT" || product.status === "REJECTED") {
    return { title: "Elan tapılmadı" };
  }
  
  const categoryName = product.category?.nameAz || "Ümumi";
  const keywords = [...(product.tags || []), categoryName, product.titleAz?.split(' ')[0] || ""].join(", ");

  return {
    title: `${product.status !== "ACTIVE" ? "(Satılıb) " : ""}${product.titleAz} — ${product.price} ${product.currency}`,
    description: product.descriptionAz?.slice(0, 155) || `${product.titleAz} FermerMarket-də satılır.`,
    keywords: keywords,
    openGraph: {
      title: product.titleAz,
      description: product.descriptionAz || "",
      images: product.images?.[0] ? [product.images[0].url] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  let product = null;
  try { product = await getProduct(slug); } catch(e) { console.error("getProduct error:", e.message); }
  if (!product || product.status === "DRAFT" || product.status === "REJECTED") notFound();

  // Fetch active ingredients of this product and alternatives
  let alternatives = [];
  let diseaseAlternatives = [];
  let pestAlternatives = [];
  try {
    const productActiveIngredients = await prisma.productActiveIngredient.findMany({
      where: { productId: product.id },
      select: { activeIngredientId: true }
    });
    const ingredientIds = productActiveIngredients.map(ai => ai.activeIngredientId);

    if (ingredientIds.length > 0) {
      alternatives = await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          id: { not: product.id },
          activeIngredients: {
            some: { activeIngredientId: { in: ingredientIds } }
          }
        },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          store: { select: { name: true, slug: true, isVerified: true } }
        },
        orderBy: { price: "asc" },
        take: 4
      });
    }

    const productDiseases = await prisma.productDisease.findMany({
      where: { productId: product.id },
      select: { diseaseId: true }
    });
    const diseaseIds = productDiseases.map(d => d.diseaseId);

    if (diseaseIds.length > 0) {
      diseaseAlternatives = await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          id: { not: product.id },
          diseases: { some: { diseaseId: { in: diseaseIds } } }
        },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, store: { select: { name: true, slug: true, isVerified: true } } },
        orderBy: { createdAt: "desc" },
        take: 4
      });
    }

    const productPests = await prisma.productPest.findMany({
      where: { productId: product.id },
      select: { pestId: true }
    });
    const pestIds = productPests.map(p => p.pestId);

    if (pestIds.length > 0) {
      pestAlternatives = await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          id: { not: product.id },
          pests: { some: { pestId: { in: pestIds } } }
        },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, store: { select: { name: true, slug: true, isVerified: true } } },
        orderBy: { createdAt: "desc" },
        take: 4
      });
    }
  } catch (e) {
    console.error("alternatives fetch error:", e.message);
  }

  let sidebarAd = null, related = { heading: "", items: [], tierById: {} };
  let otherListings = [];

  try {
    const promises = [
      getAdSlotContent("PRODUCT_DETAIL_SIDEBAR", { region: product.region }),
      getRelatedProducts(product),
    ];
    if (product.sellerId) {
      promises.push(
        prisma.product.findMany({
          where: {
            sellerId: product.sellerId,
            status: "ACTIVE",
            id: { not: product.id }
          },
          take: 5,
          include: { images: { take: 1 } }
        })
      );
    }
    const resolved = await Promise.all(promises);
    sidebarAd = resolved[0];
    related = resolved[1];
    if (product.sellerId) {
      otherListings = resolved[2] || [];
    }
  } catch(e) {
    console.error("product page sidebar/related/seller error:", e.message);
  }

  const isGuestListing = !product.sellerId;
  const contactPhone = isGuestListing ? product.guestPhone : product.seller?.phone;
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || product.store?.whatsapp || contactPhone || "994501234567";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.titleAz,
    description: product.descriptionAz || `${product.titleAz} məhsulu FermerMarket-də`,
    image: (product.images || []).map((i) => i.url),
    sku: product.productCode || product.id,
    mpn: product.barcode || undefined,
    brand: {
      "@type": "Brand",
      name: product.manufacturer || product.store?.name || "FermerMarket Satıcısı"
    },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: product.status === "ACTIVE" && product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: product.store?.name || product.seller?.fullName || product.guestName || "Satıcı"
      }
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Səhifə", item: "/" },
      { "@type": "ListItem", position: 2, name: product.category?.nameAz || "Kateqoriyalar", item: `/products${product.category?.slug ? `?category=${product.category.slug}` : ""}` },
      { "@type": "ListItem", position: 3, name: product.titleAz },
    ],
  };

  const seller = product.seller ? {
    ...product.seller,
    otherListings
  } : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="grid md:grid-cols-2 gap-8">
        <ProductGallery images={product.images || []} title={product.titleAz} />

        <div>
          {product.status !== "ACTIVE" && (
            <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm">
              <span className="text-xl"></span>
              <div>
                <h3 className="font-bold text-sm">Bu elan aktiv deyil</h3>
                <p className="text-xs mt-0.5">Məhsul satılıb və ya vaxtı bitib. Zəhmət olmasa, aşağıdakı oxşar məhsullara göz atın.</p>
              </div>
            </div>
          )}
          
          <p className="text-sm text-brand-700 font-semibold">{product.category?.nameAz || "Ümumi"}</p>
          <h1 className="text-2xl font-extrabold mt-1">{product.titleAz}</h1>
          <p className="text-3xl font-extrabold text-brand-700 mt-3">
            {Number(product.price).toLocaleString("az-AZ")} {product.currency}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {product.city || product.region || "Qeyd olunmayıb"} · Stok: {product.stock}
          </p>
          {product.store && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-sm text-gray-600"> Satıcı:</span>
              {product.store.slug ? (
                <Link href={`/stores/${product.store.slug}`} className="font-bold text-brand-700 hover:underline text-sm flex items-center gap-1">
                  {product.store.name}
                  {product.store.isVerified && <Icon name="checkCircle" size={16} className="text-blue-500 inline" />}
                </Link>
              ) : (
                <strong className="text-sm flex items-center gap-1">
                  {product.store.name}
                  {product.store.isVerified && <Icon name="checkCircle" size={16} className="text-blue-500 inline" />}
                </strong>
              )}
            </div>
          )}
          {product.isCorporate && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                Korporativ / Toplu satış
              </span>
              {product.minOrderQty && (
                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium px-3 py-1 rounded-full">
                   Minimum sifariş: <strong className="ml-1">{product.minOrderQty} ədəd</strong>
                </span>
              )}
            </div>
          )}
          {isGuestListing && (
            <p className="text-sm text-gray-600 mt-2">
              Elan sahibi: <strong>{product.guestName}</strong>
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Fərdi elan</span>
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            {isGuestListing ? (
              contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm"
                >
                   Zəng et: {contactPhone}
                </a>
              )
            ) : product.isCorporate ? (
              <>
                <QuoteRequestModal sellerId={product.sellerId} productId={product.id} productTitle={product.titleAz} minOrderQty={product.minOrderQty} />
                <WhatsAppButton phone={whatsappNumber} message={`Salam, "${product.titleAz}" elanı üçün kotirovka/toplu sifariş ilə maraqlanıram.`} label="WhatsApp ilə kotirovka" />
              </>
            ) : (
              <>
                <AddToCartButton product={{ id: product.id, title: product.titleAz, price: Number(product.price), coverImage: product.images[0]?.url, isCorporate: product.isCorporate, minOrderQty: product.minOrderQty }} />
                {product.allowInstallment && product.store?.installmentEnabled && (
                  <CreditRequestModal product={{ id: product.id, title: product.titleAz, price: Number(product.price), code: product.productCode || product.id, store: product.store }} />
                )}
              </>
            )}
            
            {!product.isCorporate && (
              <WhatsAppButton phone={whatsappNumber} message={`Salam, "${product.titleAz}" elanı haqqında məlumat almaq istəyirəm.`} />
            )}
            
            <CompareButton productId={product.id} />
            
            {!isGuestListing && product.sellerId && !product.isCorporate && (
              <ContactSellerButton sellerId={product.sellerId} productId={product.id} productTitle={product.titleAz} />
            )}
          </div>

          <ProductPdfButtons product={product} />

          {product.descriptionAz && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <h2 className="font-bold mb-2">Təsvir</h2>
              <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{product.descriptionAz}</p>
            </div>
          )}

          {/* Agro Details */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <h2 className="font-bold mb-4">Məhsulun xüsusiyyətləri</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {product.activeIngredients?.length > 0 && (
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Aktiv maddə:</span>
                  <span className="font-medium text-right">
                    {product.activeIngredients.map(a => `${a.ingredient.nameAz} ${a.concentration || ''}`).join(', ')}
                  </span>
                </div>
              )}
              {product.preparativeForm && (
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Preparat forması:</span>
                  <span className="font-medium">{product.preparativeForm}</span>
                </div>
              )}
              {product.useNorm && (
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Sərfiyyat norması:</span>
                  <span className="font-medium">{product.useNorm}</span>
                </div>
              )}
              {product.waterVolume && (
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Su norması:</span>
                  <span className="font-medium">{product.waterVolume}</span>
                </div>
              )}
              {product.waitingPeriod !== null && (
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Gözləmə müddəti:</span>
                  <span className="font-medium">{product.waitingPeriod} gün</span>
                </div>
              )}
              {product.maxApplications !== null && (
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">Maksimum tətbiq:</span>
                  <span className="font-medium">{product.maxApplications} dəfə</span>
                </div>
              )}
              {product.manufacturer && (
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">İstehsalçı:</span>
                  <span className="font-medium">{product.manufacturer}</span>
                </div>
              )}
              {product.countryOfOrigin && (
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-500">İstehsal ölkəsi:</span>
                  <span className="font-medium">{product.countryOfOrigin}</span>
                </div>
              )}
            </div>

            {(product.crops?.length > 0 || product.diseases?.length > 0 || product.pests?.length > 0) && (
              <div className="mt-4 space-y-3">
                {product.crops?.length > 0 && (
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tətbiq olunan bitkilər:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.crops.map(c => <span key={c.crop.id} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md border border-green-100">{c.crop.nameAz}</span>)}
                    </div>
                  </div>
                )}
                {product.diseases?.length > 0 && (
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Xəstəliklər:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.diseases.map(d => <span key={d.disease.id} className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-md border border-red-100">{d.disease.nameAz}</span>)}
                    </div>
                  </div>
                )}
                {product.pests?.length > 0 && (
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Zərərvericilər:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.pests.map(p => <span key={p.pest.id} className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-md border border-orange-100">{p.pest.nameAz}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {product.tags.map((tag, i) => (
                <a
                  key={i}
                  href={`/products?search=${encodeURIComponent(tag)}`}
                  className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full font-medium transition-colors"
                >
                  #{tag}
                </a>
              ))}
            </div>
          )}

          {/* Alternatives Widget */}
          {alternatives.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-bold text-sm text-gray-800 mb-3"> Oxşar Tərkibli Alternativlər (Daha Sərfəli)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {alternatives.map((alt) => (
                  <Link
                    key={alt.id}
                    href={`/products/${alt.slug}`}
                    className="p-3 bg-gray-50 hover:bg-brand-50/50 rounded-xl flex gap-3 text-left transition-all border border-gray-100/50"
                  >
                    <div className="w-12 h-12 relative rounded-lg bg-white overflow-hidden flex-shrink-0">
                      {alt.images?.[0]?.url ? (
                        <SafeImage src={alt.images[0].url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg"></div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-xs text-gray-800 line-clamp-1">{alt.titleAz}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{alt.store?.name || "Klassik Elan"}</p>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <span className="text-xs font-black text-brand-700">₼{Number(alt.price).toLocaleString("az-AZ")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {diseaseAlternatives.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="font-bold text-sm text-gray-800 mb-3">Bu Xəstəliklərə Qarşı Digər Dərmanlar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {diseaseAlternatives.map((alt) => (
                  <Link
                    key={alt.id}
                    href={`/products/${alt.slug}`}
                    className="p-3 bg-gray-50 hover:bg-red-50/50 rounded-xl flex gap-3 text-left transition-all border border-gray-100/50"
                  >
                    <div className="w-12 h-12 relative rounded-lg bg-white overflow-hidden flex-shrink-0">
                      {alt.images?.[0]?.url ? (
                        <SafeImage src={alt.images[0].url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg"></div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-xs text-gray-800 line-clamp-1">{alt.titleAz}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{alt.store?.name || "Klassik Elan"}</p>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <span className="text-xs font-black text-brand-700">₼{Number(alt.price).toLocaleString("az-AZ")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {pestAlternatives.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="font-bold text-sm text-gray-800 mb-3">Bu Zərərvericilərə Qarşı Digər Dərmanlar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pestAlternatives.map((alt) => (
                  <Link
                    key={alt.id}
                    href={`/products/${alt.slug}`}
                    className="p-3 bg-gray-50 hover:bg-orange-50/50 rounded-xl flex gap-3 text-left transition-all border border-gray-100/50"
                  >
                    <div className="w-12 h-12 relative rounded-lg bg-white overflow-hidden flex-shrink-0">
                      {alt.images?.[0]?.url ? (
                        <SafeImage src={alt.images[0].url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg"></div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-xs text-gray-800 line-clamp-1">{alt.titleAz}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{alt.store?.name || "Klassik Elan"}</p>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <span className="text-xs font-black text-brand-700">₼{Number(alt.price).toLocaleString("az-AZ")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <ShareButtons product={product} />

          {/* Seller details card */}
          {seller && (
            <div className="card p-5 mt-6 border border-gray-100 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                 <h3 className="font-bold text-sm">Satıcı haqqında</h3>
                 <Link href={`/seller/${seller.id}`} className="text-[11px] text-brand-600 font-bold hover:underline bg-brand-50 px-2 py-1 rounded-md"><span className="inline-flex items-center gap-1">Profilə bax <Icon name="arrowRight" size={12} /></span></Link>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold">
                  {seller.fullName?.[0]}
                </div>
                <div>
                  <p className="font-bold">{seller.fullName}</p>
                  <p className="text-xs text-gray-500">{seller.role === 'STORE' ? 'Mağaza' : 'İstifadəçi'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="inline-flex items-center gap-0.5">{[...Array(5)].map((_, i) => <Icon key={i} name="star" size={12} className={i < Math.round(seller.avgRating||0) ? "text-amber-400 fill-amber-400" : "text-gray-300"} />)}</span>
                    <span className="text-xs text-gray-400">({seller.reviewCount||0} rəy)</span>
                  </div>
                </div>
              </div>
              {/* Other listings */}
              {seller.otherListings?.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-gray-500 mb-2">Bu satıcının digər elanları:</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {seller.otherListings.slice(0,5).map(l => (
                      <a key={l.id} href={`/products/${l.slug}`} className="shrink-0 w-20">
                        <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden mb-1">
                          {l.images?.[0] ? <img src={l.images[0].url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xl"></div>}
                        </div>
                        <p className="text-[10px] font-medium line-clamp-2 leading-tight">{l.titleAz}</p>
                        <p className="text-[10px] font-bold text-brand-700 mt-0.5">₼{Number(l.price).toLocaleString()}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <ReportModal productId={product.id} productTitle={product.titleAz} />
              </div>
            </div>
          )}

          <AdBanner content={sidebarAd} className="mt-6" label="Sponsorlu" imgClassName="w-full h-32 object-cover rounded-2xl" />
        </div>
      </div>

      {related.items.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold mb-4">{related.heading}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.items.map((p) => (
              <ProductCard
                key={p.id}
                tier={related.tierById[p.id]}
                product={{
                  slug: p.slug,
                  title: p.titleAz,
                  price: Number(p.price),
                  currency: p.currency,
                  coverImage: p.images[0]?.url,
                  region: p.region,
                }}
              />
            ))}
          </div>
        </section>
      )}

      <ProductReviews productId={product.id} />

      <div className="mt-6 text-center">
        <Link href="/products" className="text-brand-700 font-semibold text-sm hover:underline">
          <span className="inline-flex items-center gap-1"><Icon name="arrowLeft" size={14} /> Bütün elanlara bax</span>
        </Link>
      </div>

      {/* Mobile Sticky Add-to-Cart Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Qiymət</span>
          <span className="text-lg font-black text-brand-700">₼{Number(product.price).toLocaleString("az-AZ")}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isGuestListing && !product.isCorporate && (
            <AddToCartButton product={{ id: product.id, title: product.titleAz, price: Number(product.price), coverImage: product.images[0]?.url, isCorporate: product.isCorporate, minOrderQty: product.minOrderQty }} />
          )}
          <WhatsAppButton phone={whatsappNumber} message={`Salam, "${product.titleAz}" elanı haqqında məlumat almaq istəyirəm.`} />
        </div>
      </div>
    </div>
  );
}
