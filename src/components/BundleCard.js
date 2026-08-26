"use client";
import { useState } from "react";
import SafeImage from "@/components/SafeImage";
import { addToCart } from "@/lib/cartClient";
import Icon from "@/components/ui/Icon";

export default function BundleCard({ bundle }) {
  const [added, setAdded] = useState(false);
  const ratio = bundle.subtotal > 0 ? bundle.finalPrice / bundle.subtotal : 1;

  function handleAddAll() {
    bundle.items.forEach((item) => {
      const discountedPrice = Number(item.product.price) * ratio;
      addToCart(
        {
          id: item.product.id,
          title: item.product.titleAz,
          price: discountedPrice,
          coverImage: item.product.images?.[0]?.url,
        },
        item.quantity || 1
      );
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="card p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold truncate text-sm sm:text-base">{bundle.title}</h3>
        <span className="tag-badge bg-amber-100 text-amber-800 whitespace-nowrap shrink-0">
          {bundle.discountType === "PERCENTAGE" ? `-${Number(bundle.discountValue)}%` : `-${Number(bundle.discountValue)} AZN`}
        </span>
      </div>
      {bundle.description && <p className="text-xs text-gray-500 line-clamp-2">{bundle.description}</p>}

      <div className="flex -space-x-2">
        {bundle.items.slice(0, 4).map((item) => (
          <div key={item.id} className="relative w-12 h-12 rounded-lg border-2 border-white overflow-hidden bg-gray-100">
            {item.product.images?.[0]?.url && (
              <SafeImage src={item.product.images[0].url} alt={item.product.titleAz} fill className="object-cover" />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">{bundle.items.map((i) => i.product.titleAz).join(", ")}</p>

      <div className="flex items-center gap-2">
        <span className="line-through text-gray-400 text-sm">{bundle.subtotal.toFixed(2)} AZN</span>
        <span className="font-extrabold text-brand-700 text-lg">{bundle.finalPrice.toFixed(2)} AZN</span>
      </div>

      <button onClick={handleAddAll} className="btn-primary w-full text-sm">
        {added ? <><Icon name="check" size={16} /> Səbətə əlavə edildi</> : <><Icon name="cart" size={16} /> Hamısını səbətə əlavə et</>}
      </button>
      {bundle.seller?.fullName && <p className="text-[11px] text-gray-400">Satıcı: {bundle.seller.fullName}</p>}
    </div>
  );
}
