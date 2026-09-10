// DB'de base64 (data: URL) olarak saxlanan şəkilləri keşlənə bilən /api/img
// proxy-si üzərindən xidmət edir. Bu, səhifə/API həcmini ~10x azaldır.

export const IMG_PROXY = "/api/img";

export function publicImgUrl(img) {
  if (!img?.url) return null;
  return img.url.startsWith("data:") ? `${IMG_PROXY}/${img.id}` : img.url;
}

export function publicStoreLogo(store) {
  if (!store?.logoUrl) return null;
  return store.logoUrl.startsWith("data:") ? `${IMG_PROXY}/st-${store.id}` : store.logoUrl;
}

export function publicStoreCover(store) {
  if (!store?.coverUrl) return null;
  return store.coverUrl.startsWith("data:") ? `${IMG_PROXY}/sc-${store.id}` : store.coverUrl;
}

// Prisma product obyektinin images[] URL-lərini proxy-yə yönləndirir
export function mapProductImages(p) {
  if (!p) return p;
  if (!p.images) return p;
  return {
    ...p,
    images: p.images.map((img) => ({ ...img, url: publicImgUrl(img) })),
  };
}
