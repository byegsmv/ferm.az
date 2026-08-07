import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/ui/Icon";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const seller = await prisma.user.findUnique({
    where: { id },
    select: { id: true, fullName: true, status: true },
  });
  if (!seller) return { title: "Satıcı Tapılmadı" };
  return { title: `${seller.fullName} - FermerMarket` };
}

export default async function SellerProfilePage({ params }) {
  const { id } = await params;

  const seller = await prisma.user.findUnique({
    where: { id },
    include: {
      store: true,
      products: {
        where: { status: "ACTIVE" },
        include: { images: { take: 1 }, category: true, listing: true },
        orderBy: [{ listing: { tier: "desc" } }, { createdAt: "desc" }]
      }
    }
  });

  if (!seller) notFound();

  // If user is banned, show a deactivation notice instead of their listings
  const isBanned = seller.status === "BANNED";

  const isVerified = seller.emailVerified || (seller.store && seller.store.isVerified);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 md:pb-12 pt-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-600 to-green-500 opacity-90" />
           <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-end mt-8">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md shrink-0">
                 <div className="w-full h-full bg-brand-100 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt={seller.store?.name || seller.fullName} className="w-3/4 h-3/4 object-contain" />
                 </div>
              </div>
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                   <h1 className="text-2xl font-bold text-gray-900">{seller.store?.name || seller.fullName}</h1>
                   {isVerified && <Icon name="badge-check" className="text-blue-500 w-6 h-6" fill="currentColor" />}
                 </div>
                 <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="text-amber-500"></span> {seller.avgRating > 0 ? seller.avgRating.toFixed(1) : "Yeni"} ({seller.reviewCount} rəy)
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">•</span>
                    <span>Qeydiyyat: {new Date(seller.createdAt).getFullYear()}</span>
                 </div>
                 <div className="flex items-center gap-3 mt-2">
                   <span className="flex items-center gap-1 bg-green-50 border border-green-100 text-green-700 px-2.5 py-1 rounded-lg font-semibold text-xs">
                       Çatdırılma: {seller.deliveryRating > 0 ? seller.deliveryRating.toFixed(1) + " / 5.0" : "Qiymətləndirilməyib"}
                   </span>
                   {seller.onTimeDeliveryRate > 0 && (
                     <span className="flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-semibold text-xs">
                       <span className="flex items-center gap-1"><Icon name="clock" size={14} className="text-gray-500" /> Vaxtında çatdırma: {seller.onTimeDeliveryRate}%</span>
                     </span>
                   )}
                 </div>
              </div>
              <div className="shrink-0 flex gap-3 w-full md:w-auto">
                 {seller.phone && !isBanned && (
                   <a href={`tel:${seller.phone}`} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 transition">
                     Zəng et
                   </a>
                 )}
              </div>
           </div>
           {seller.store?.description && !isBanned && (
             <p className="mt-6 text-gray-600 text-sm leading-relaxed max-w-3xl">
               {seller.store.description}
             </p>
           )}
        </div>

        {/* Banned notice */}
        {isBanned && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <Icon name="alert" size={32} className="mx-auto text-red-400 mb-2" />
            <p className="font-bold text-red-700">Bu satçının hesabı bloklanıb</p>
            <p className="text-sm text-red-600 mt-1">Hal-hazırda bu satçının elanları mövcud deyil.</p>
          </div>
        )}

        {/* Seller's Products (only if not banned) */}
        {!isBanned && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Bütün Elanlar ({seller.products.length})</h2>
            </div>
            
            {seller.products.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Icon name="package" size={30} strokeWidth={1.6} />
                </div>
                <p className="mt-3 font-semibold text-gray-900">Hələlik elan yoxdur</p>
                <p className="text-sm text-gray-500">Bu satıcının aktiv elanı yoxdur.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {seller.products.map(p => (
                  <ProductCard 
                    key={p.id} 
                    tier={p.listing?.tier}
                    product={{
                      id: p.id,
                      slug: p.slug,
                      title: p.titleAz,
                      price: Number(p.price),
                      coverImage: p.images?.[0]?.url,
                      region: p.region,
                      city: p.city
                    }} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
