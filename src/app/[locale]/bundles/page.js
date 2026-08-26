"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/apiClient";
import Link from "next/link";
import { addToCart } from "@/lib/cartClient";

export default function BundlesPage() {
  const t = useTranslations("Navigation");
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/bundles")
      .then((data) => setBundles(data.bundles || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAddBundleToCart = (bundle) => {
    // Add each item in the bundle to the cart, ideally preserving bundle context or just as separate items.
    // For now, we add them individually but maybe apply the bundle discount later if logic supports it.
    bundle.items.forEach((item) => {
      // Create a composite bundle item, or add individually.
      addToCart({
        id: item.product.id,
        titleAz: item.product.titleAz,
        price: item.product.price, // Will be handled at checkout for discounts
        coverImage: item.product.images?.[0]?.url,
        sellerId: bundle.sellerId,
      });
    });
    // Fire an event if cart needs to open
    window.dispatchEvent(new Event("fmk-cart-open"));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight"> Sərfəli Bağlamalar</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Məhsulları paket şəklində alaraq daha çox qənaət edin. Fermerlərin xüsusi təklifləri.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center mb-8">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl p-6 h-64 border border-gray-100" />
          ))}
        </div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">Hazırda aktiv bağlama yoxdur.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 flex flex-col hover:shadow-xl transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-500 text-white font-black text-sm px-4 py-1.5 rounded-bl-2xl">
                {bundle.discountType === "PERCENTAGE" ? `-${Number(bundle.discountValue)}% ENDİRİM` : `-${Number(bundle.discountValue)} AZN`}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mt-2 mb-2 pr-20">{bundle.title}</h2>
              {bundle.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{bundle.description}</p>}
              
              <div className="bg-gray-50 rounded-2xl p-4 flex-1 mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Bağlamaya daxildir:</p>
                <ul className="space-y-2">
                  {bundle.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                      {item.product.images?.[0]?.url ? (
                        <img src={item.product.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-xs"></div>
                      )}
                      <Link href={`/products/${item.product.slug}`} className="hover:text-brand-600 truncate flex-1">
                        {item.product.titleAz}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-end justify-between mt-auto">
                <div>
                  <p className="text-sm text-gray-400 line-through mb-0.5">{bundle.subtotal.toFixed(2)} AZN</p>
                  <p className="text-2xl font-black text-brand-700">{bundle.finalPrice.toFixed(2)} AZN</p>
                </div>
                <button 
                  onClick={() => handleAddBundleToCart(bundle)}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-md shadow-brand-200"
                >
                  Səbətə At
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
