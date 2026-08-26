"use client";
import { useState } from "react";
import { addToCart } from "@/lib/cartClient";
import Icon from "@/components/ui/Icon";

export default function AddToCartButton({ product }) {
  const [added, setAdded] = useState(false);
  const [info, setInfo] = useState("");

  const minQty = product?.isCorporate && product?.wholesaleMinQty && product?.allowRetail === false 
    ? product.wholesaleMinQty 
    : 1;

  function handleClick() {
    try {
      // Ensure we pass isCorporate and minOrderQty so cartClient can enforce min
      const result = addToCart(
        {
          id: product.id,
          title: product.title || product.titleAz,
          price: product.price || product.price || 0,
          coverImage: product.coverImage || product.coverImage || product.images?.[0]?.url || null,
          isCorporate: !!product.isCorporate,
          minOrderQty: product.minOrderQty || 1,
          allowRetail: product.allowRetail,
          wholesalePrice: product.wholesalePrice,
          wholesaleMinQty: product.wholesaleMinQty,
          unit: product.unit
        },
        1
      );

      setAdded(true);
      setInfo("");
      if (result.minQty > 1) {
        setInfo(`${result.minQty} ədəd əlavə edildi (minimum sifariş)`);
      }
      setTimeout(() => {
        setAdded(false);
        setInfo("");
      }, 2500);
    } catch (err) {
      setInfo(err?.message || "Səbətə əlavə etmək mümkün olmadı");
      setTimeout(() => setInfo(""), 3500);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleClick}
        className={`btn-primary transition-all ${added ? "bg-emerald-600" : ""}`}
      >
        {added ? <><Icon name="check" size={17} /> Səbətə əlavə edildi</> : <><Icon name="cart" size={17} /> Səbətə əlavə et</>}
      </button>
      {minQty > 1 && !added && (
        <p className="text-xs text-orange-600 font-medium text-center">
          <><Icon name="package" size={14} /> Minimum sifariş: {minQty} {product?.unit || "ədəd"}</>
        </p>
      )}
      {info && (
        <p className="text-xs text-green-600 font-medium text-center">{info}</p>
      )}
    </div>
  );
}
