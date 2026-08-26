"use client";

const CART_KEY = "fmk_cart";

export function getCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("fmk-cart-changed"));
}

function getMinOrderQty(item) {
  if (!item?.isCorporate) return 1;
  const wholesaleMin = Number(item?.wholesaleMinQty) || 1;
  // If retail is NOT allowed, they MUST buy at least wholesaleMin
  if (item.allowRetail === false) return wholesaleMin;
  return 1;
}

export function getItemPrice(item) {
  if (item.isCorporate && item.wholesaleMinQty && item.quantity >= item.wholesaleMinQty && item.wholesalePrice) {
    return Number(item.wholesalePrice);
  }
  return Number(item.basePrice || item.price);
}

export function addToCart(product, quantity = 1) {
  const items = getCart();
  const existing = items.find((i) => i.productId === product.id);

  const minQty = getMinOrderQty(product);
  const requestedQty = Number.isFinite(Number(quantity)) ? Math.max(1, Math.floor(Number(quantity))) : 1;

  if (existing) {
    const currentQty = Number.isFinite(Number(existing.quantity)) ? Number(existing.quantity) : 0;
    existing.quantity = Math.max(currentQty + requestedQty, minQty);
    existing.isCorporate = !!product.isCorporate;
    existing.allowRetail = product.allowRetail !== undefined ? product.allowRetail : true;
    existing.wholesaleMinQty = product.wholesaleMinQty || product.minOrderQty || null;
    existing.wholesalePrice = product.wholesalePrice || null;
    existing.basePrice = Number(product.price);
  } else {
    items.push({
      productId: product.id,
      title: product.title || product.titleAz,
      price: Number(product.price),
      basePrice: Number(product.price),
      coverImage: product.coverImage || product.images?.[0]?.url || null,
      quantity: Math.max(requestedQty, minQty),
      isCorporate: !!product.isCorporate,
      allowRetail: product.allowRetail !== undefined ? product.allowRetail : true,
      wholesaleMinQty: product.wholesaleMinQty || product.minOrderQty || null,
      wholesalePrice: product.wholesalePrice || null,
      unit: product.unit || "ədəd"
    });
  }
  saveCart(items);
  return { items, minQty };
}

export function updateQuantity(productId, quantity) {
  let items = getCart();
  const item = items.find((i) => i.productId === productId);

  if (quantity <= 0) {
    items = items.filter((i) => i.productId !== productId);
  } else if (item) {
    item.quantity = Math.max(Math.floor(Number(quantity)) || 1, getMinOrderQty(item));
  }
  saveCart(items);
  return items;
}

export function removeFromCart(productId) {
  const items = getCart().filter((i) => i.productId !== productId);
  saveCart(items);
  return items;
}

export function clearCart() {
  saveCart([]);
}

export function cartTotal(items) {
  return items.reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0);
}

export function cartCount(items) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
