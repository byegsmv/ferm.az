const heroProducts = [
  {
    id: "fallback-premium-1",
    slug: "premium-toksum-az",
    titleAz: "Premium toxum paketi",
    title: "Premium toxum paketi",
    price: 185,
    currency: "AZN",
    region: "Bakı",
    city: "Bakı",
    coverImage: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80",
    tags: ["toxum", "premium"],
  },
  {
    id: "fallback-premium-2",
    slug: "agro-texnika-az",
    titleAz: "Aqro texnika komplekti",
    title: "Aqro texnika komplekti",
    price: 3200,
    currency: "AZN",
    region: "Gəncə",
    city: "Gəncə",
    coverImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    tags: ["texnika", "sürətli"],
  },
  {
    id: "fallback-premium-3",
    slug: "gubre-kombi-az",
    titleAz: "NPK gübrəsi",
    title: "NPK gübrəsi",
    price: 95,
    currency: "AZN",
    region: "Şəki",
    city: "Şəki",
    coverImage: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=800&q=80",
    tags: ["gübrə", "səfərbərlik"],
  },
];

const categories = [
  { id: "fallback-cat-1", slug: "heyvandarliq", nameAz: "Heyvandarlıq", icon: "dog" },
  { id: "fallback-cat-2", slug: "qusculuq", nameAz: "Quşçuluq", icon: "bird" },
  { id: "fallback-cat-3", slug: "texnika", nameAz: "Texnika", icon: "tractor" },
  { id: "fallback-cat-4", slug: "gubre", nameAz: "Gübrə", icon: "sprout" },
  { id: "fallback-cat-5", slug: "toxum", nameAz: "Toxum", icon: "leaf" },
];

const bundles = [
  {
    id: "fallback-bundle-1",
    title: "Yaz bağlaması",
    description: "Toxum, gübrə və korpus üçün birgə paket",
    discountType: "PERCENTAGE",
    discountValue: 12,
    subtotal: 640,
    finalPrice: 563,
    items: [
      { id: "bundle-item-1", quantity: 1, product: { id: "i1", titleAz: "Toxum paketi", price: 210, images: [{ url: heroProducts[0].coverImage }] } },
      { id: "bundle-item-2", quantity: 1, product: { id: "i2", titleAz: "Gübrə paketi", price: 180, images: [{ url: heroProducts[2].coverImage }] } },
    ],
    seller: { fullName: "Agro Plus" },
  },
];

const blogPosts = [
  {
    id: "fallback-blog-1",
    slug: "yaz-movsumu-ucun-plan",
    title: "Yaz mövsümü üçün aqrar planlama",
    excerpt: "Məhsulunuzu daha sürətli və daha qənaətli satışa hazırlayın.",
    createdAt: new Date().toISOString(),
    author: { fullName: "Nərmin Əliyeva" },
  },
];

export function getHomeFallbackData() {
  return {
    categories,
    premiumListings: [
      {
        id: "fallback-listing-1",
        tier: "PREMIUM",
        product: {
          slug: heroProducts[0].slug,
          titleAz: heroProducts[0].titleAz,
          price: heroProducts[0].price,
          region: heroProducts[0].region,
          images: [{ url: heroProducts[0].coverImage }],
        },
      },
      {
        id: "fallback-listing-2",
        tier: "VIP",
        product: {
          slug: heroProducts[1].slug,
          titleAz: heroProducts[1].titleAz,
          price: heroProducts[1].price,
          region: heroProducts[1].region,
          images: [{ url: heroProducts[1].coverImage }],
        },
      },
    ],
    homepageAd: null,
    latestProducts: heroProducts,
    bundles,
    blogPosts,
  };
}
