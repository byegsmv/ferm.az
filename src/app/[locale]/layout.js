import { Inter } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AdBanner from "@/components/AdBanner";
import { getAdSlotContent } from "@/lib/adSlots";
import Footer from "@/components/Footer";
import AIAgronomWidget from "@/components/AIAgronomWidget";
import SmoothScroll from "@/components/SmoothScroll";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Toaster } from "react-hot-toast";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://fermermarket.az");

export async function generateMetadata() {
  let dbTitle = "FermerMarket — Aqrar Bazar Platforması | Heyvan, Gübrə, Texnika Satışı";
  let dbDesc = "FermerMarket — Azərbaycanda fermerlər, mağazalar, aqronomlar və alıcıları birləşdirən AI dəstəkli kənd təsərrüfatı marketplace-i. Mal-qara, gübrə, toxum, texnika elanları, AI aqronom məsləhəti.";
  let dbKeywords = ["kənd təsərrüfatı", "gübrə", "traktor satılır", "dana satılır", "qoyun satılır", "bal satışı", "aqronom", "fermer bazarı", "azərbaycan marketplace"];

  try {
    const titleSet = await prisma.setting.findUnique({ where: { key: "seo.homepage.title" } });
    if (titleSet?.value) dbTitle = titleSet.value;

    const descSet = await prisma.setting.findUnique({ where: { key: "seo.homepage.description" } });
    if (descSet?.value) dbDesc = descSet.value;

    const keySet = await prisma.setting.findUnique({ where: { key: "seo.homepage.keywords" } });
    if (keySet?.value) dbKeywords = keySet.value.split(",").map(s => s.trim());
  } catch(e) {}

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dbTitle,
      template: "%s | FermerMarket",
    },
    description: dbDesc,
    keywords: dbKeywords,
    manifest: "/manifest.json",
    openGraph: {
      type: "website",
      locale: "az_AZ",
      siteName: "FermerMarket",
      title: dbTitle,
      description: dbDesc,
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: { index: true, follow: true },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "FermerMarket",
    },
  };
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    return (
      <html lang="az">
        <body>{children}</body>
      </html>
    );
  }

  const messages = await getMessages();
  const topAd = await getAdSlotContent("home_top");
  const bottomAd = await getAdSlotContent("home_bottom");

  return (
    <html lang={locale} dir="ltr">
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 text-gray-900`}>
        <NextIntlClientProvider messages={messages}>
          <SmoothScroll>
            <ServiceWorkerRegister />
            <PWAInstallPrompt />
            <Toaster position="top-center" />
            
            {topAd && <AdBanner ad={topAd} position="top" />}
            
            <Header />
            <main className="flex-1 w-full max-w-[1440px] mx-auto pb-16 md:pb-0">
              {children}
            </main>
            
            {bottomAd && <AdBanner ad={bottomAd} position="bottom" />}
            
            <BottomNav />
            <Footer />
            <AIAgronomWidget />
          </SmoothScroll>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
