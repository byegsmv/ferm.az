export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://fermermarket.az";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/cart", "/checkout"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
