"use client";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import SafeImage from "@/components/SafeImage";
import { getCart, updateQuantity, removeFromCart, cartTotal, getItemPrice } from "@/lib/cartClient";
import Icon from "@/components/ui/Icon";

export default function CartPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  function refresh(newItems) {
    setItems([...newItems]);
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center pb-24">
        <Icon name="cart" size={44} className="mx-auto mb-3 text-gray-300" strokeWidth={1.4} />
        <h1 className="text-xl font-bold">Səbətiniz boşdur</h1>
        <Link href="/products" className="btn-primary inline-block mt-5">Elanlara bax</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold mb-4">Səbət ({items.length} məhsul)</h1>
      <div className="space-y-3">
        {items.map((item) => {
          const wholesaleMin = item.wholesaleMinQty || 1;
          const minQty = item.isCorporate && item.allowRetail === false ? wholesaleMin : 1;
          const unit = item.unit || "ədəd";
          const currentPrice = getItemPrice(item);
          const isWholesalePriceApplied = item.isCorporate && item.wholesaleMinQty && item.quantity >= item.wholesaleMinQty && item.wholesalePrice;

          return (
            <div key={item.productId} className="card p-3 sm:p-4 flex items-center gap-3 rounded-2xl">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                {item.coverImage ? (
                  <SafeImage src={item.coverImage} alt={item.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-300"><Icon name="sprout" size={26} strokeWidth={1.4} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.title}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-green-700 font-bold text-sm">{currentPrice} AZN</p>
                  {isWholesalePriceApplied && (
                    <span className="text-[10px] bg-green-100 text-green-800 px-1.5 rounded font-bold">Topdan qiymət!</span>
                  )}
                </div>
                {item.isCorporate && (
                  <span className="text-[10px] text-orange-600 font-semibold bg-orange-50 px-1.5 py-0.5 rounded-full block w-max mt-1">
                    Min. sifariş: {minQty} {unit}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  aria-label="Azalt"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-40 font-bold text-base transition-all"
                  disabled={item.quantity <= minQty}
                  onClick={() => refresh(updateQuantity(item.productId, item.quantity - 1))}
                  ><span aria-hidden="true">−</span></button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  aria-label="Artır"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 font-bold text-base transition-all"
                  onClick={() => refresh(updateQuantity(item.productId, item.quantity + 1))}
                ><Icon name="plus" size={15} /></button>
              </div>
              <button
                onClick={() => refresh(removeFromCart(item.productId))}
                aria-label="Sil"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all"
              ><Icon name="close" size={16} /></button>
            </div>
          );
        })}
      </div>
      <div className="card p-4 mt-5 flex items-center justify-between">
        <span className="font-semibold text-gray-700">Cəmi</span>
        <span className="text-xl font-extrabold text-green-700">{cartTotal(items).toFixed(2)} AZN</span>
      </div>
      <Link href="/checkout" className="w-full block text-center mt-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all">
        Sifarişi tamamla <Icon name="chevronDown" size={16} className="-rotate-90" />
      </Link>
    </div>
  );
}
