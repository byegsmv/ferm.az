/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.js');
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  // The Neon serverless driver and its WebSocket transport must be required
  // natively at runtime, not bundled — `ws` carries optional native bindings.
  serverExternalPackages: ["@neondatabase/serverless", "@prisma/adapter-neon", "ws"],
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src * data: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.open-meteo.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        // Public, seyrek değişen referans verisi — CDN'de 5 dakika cache
        source: "/api/categories",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
      {
        // Şəkil proxy-si. Blanket /api/:path* qaydası bu marşrutu da "no-store"
        // edirdi, ona görə hər şəkil baxışı bazadan megabaytlarla base64 çəkirdi
        // və Neon-un data transfer kvotasını yandırırdı. Şəkil məzmunu id-yə
        // görə dəyişməzdir, ona görə həmişəlik keşlənir.
        source: "/api/img/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, s-maxage=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
