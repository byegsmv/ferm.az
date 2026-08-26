import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";
import SideBanner from "@/components/Banners/SideBanner";
import InteractiveStoresMap from "@/components/InteractiveStoresMap";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Satış Nöqtələri və Mağazalar — FermerMarket",
    description: "Sizə ən yaxın kənd təsərrüfatı mağazalarını, apteklərini və satış nöqtələrini xəritədə tapın.",
  };
}

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      phone: true,
      logoUrl: true,
      isVerified: true,
      _count: { select: { products: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  let salesPoints = [];
  try {
    salesPoints = await prisma.salesPoint.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true, phone: true, region: true, lat: true, lng: true, type: true }
    });
  } catch(e) {
    console.warn("SalesPoints fetch failed:", e.message);
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1600px] mx-auto flex gap-6 px-4 py-8">
        <SideBanner position="left" />
        <div className="flex-1 min-w-0 w-full bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">

      <div className="bg-white border-b border-gray-200 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Satış Nöqtələri və Mağazalar</h1>
            <p className="text-gray-500">Sizə ən yaxın kənd təsərrüfatı apteklərini və rəsmi dilerləri tapın.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard?tab=create-store" className="bg-gray-100 text-gray-800 px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-200 font-semibold border border-gray-200">
              <Icon name="store" size={18} /> Mağaza Aç
            </Link>
            <a href="#interactive-map" className="bg-brand-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-brand-700 font-semibold">
              <Icon name="map" size={18} /> Xəritədə Bax
            </a>
          </div>
        </div>
      </div>

      {/* 1. Stores List — FIRST */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Icon name="store" size={22} className="text-brand-600" />
          Bütün Mağazalar ({stores.length})
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div key={store.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 border border-gray-200 overflow-hidden">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Icon name="store" size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 flex items-center gap-1">
                    {store.name}
                    {store.isVerified && <Icon name="checkCircle" size={16} className="text-blue-500 inline" />}
                  </h3>
                  <p className="text-sm text-brand-600 font-medium">{store._count.products} məhsul</p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                {store.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Icon name="mapPin" size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <span>{store.address}</span>
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Icon name="phone" size={16} className="text-gray-400 shrink-0" />
                    <span>{store.phone}</span>
                  </div>
                )}
              </div>
              <Link href={`/stores/${store.slug}`} className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2.5 rounded-xl transition-colors">
                Mağazaya Keç
              </Link>
            </div>
          ))}
        </div>
        {stores.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            Hələlik heç bir mağaza qeydiyyatdan keçməyib.
          </div>
        )}
      </div>

      {/* 2. Interactive Map — SECOND */}
      <div id="interactive-map" className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Icon name="map" size={22} className="text-brand-600" />
            İnteraktiv Xəritə
          </h2>
          <p className="text-gray-500 mb-6">Satış nöqtələrini və mağazaları xəritədə tapın.</p>
          <InteractiveStoresMap stores={stores} salesPoints={salesPoints} />
        </div>
      </div>

        </div>
        <SideBanner position="right" />
      </div>
    </div>
  );
}
