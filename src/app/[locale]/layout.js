import { Inter } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AdBanner from "@/components/AdBanner";
import SideAdRails from "@/components/SideAdRails";
import { getAdSlotContent, getSidebarRails } from "@/lib/adSlots";
import Footer from "@/components/Footer";
import PushPermissionPrompt from "@/components/PushPermissionPrompt";
import AIAgronomWidget from "@/components/AIAgronomWidget";
import SmoothScroll from "@/components/SmoothScroll";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Toaster } from "react-hot-toast";
import { prisma } from "@/lib/prisma";
import AdPixels from "@/components/AdPixels";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.fermermarket.az");

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
  const topAd = await getAdSlotContent("HOMEPAGE_TOP");
  const bottomAd = await getAdSlotContent("FOOTER_STRIP");
  const sideRails = await getSidebarRails();

  // Qlobal Xüsusi CSS (Visual Studio → "Qlobal CSS" paneli, admin-only yazılır)
  let globalCss = "";
  try {
    const cssBlock = await prisma.dynamicBlock.findFirst({ where: { page: "system", type: "custom_css" } });
    if (cssBlock?.props?.css) globalCss = cssBlock.props.css;
  } catch {}

  return (
    <html lang={locale} dir="ltr">
      <head>
        <meta name="theme-color" content="#4f46e5" />
        {process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION && (
          <meta name="facebook-domain-verification" content={process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION} />
        )}
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
        )}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 text-gray-900`}>
        <NextIntlClientProvider messages={messages}>
          <SmoothScroll>
            <ServiceWorkerRegister />
            <AdPixels />
            <PWAInstallPrompt />
            <WhatsAppFloat />
            <Toaster position="top-center" />
            
            {topAd && <AdBanner content={topAd} />}
            
            <Header />
            <SideAdRails left={sideRails.left} right={sideRails.right} whatsappUrl={sideRails.whatsappUrl} />
            <main className="flex-1 w-full max-w-[1200px] mx-auto pb-16 md:pb-0">
              {children}
            </main>
            
            {bottomAd && <AdBanner content={bottomAd} />}
            
            <BottomNav />
            <Footer />
            <PushPermissionPrompt />
            <AIAgronomWidget />
          </SmoothScroll>
        </NextIntlClientProvider>
      {globalCss ? <style dangerouslySetInnerHTML={{ __html: globalCss }} /> : null}
      {/* Universal Visual Editor — bütün səhifələrdə override tətbiqi (?ve=1 = redaktə rejimi) */}
      <script defer src="/visual-editor/visual-editor.js" />
      </body>
    </html>
  );
}
