import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// Default config including social links and contacts
const DEFAULT_CONFIG = {
  siteName: "FermerMarket",
  tagline: "Kənd Təsərrüfatının Rəqəmsal Bazarı",
  currency: "AZN",
  locale: "AZ",
  maintenanceMode: false,
  allowRegistration: true,
  allowListings: true,
  allowReviews: true,
  allowWallet: true,
  allowCoupons: true,
  allowBundles: true,
  allowBlog: true,
  allowPush: false,
  allowCampaigns: true,
  allowStores: true,
  showAnalytics: true,
  enableAdminAudit: true,
  require2FA: false,
  // Social media & contact defaults
  facebook: "https://www.facebook.com/share/1LDQEgQBcd/?mibextid=wwXIfr",
  instagram: "https://instagram.com/fermermarket.az",
  whatsapp: "+994 10 521 09 09",
  tiktok: "https://tiktok.com/@fermermarket.az",
  telegram: "https://t.me/fermermarket",
  youtube: "https://youtube.com/@fermermarket",
  phone: "+994 10 521 09 09",
  email: "info@fermermarket.az",
  address: "Bakı şəhəri, Azərbaycan"
};

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    let block = await prisma.dynamicBlock.findFirst({
      where: { page: "system", type: "admin_config" }
    });

    const config = block ? { ...DEFAULT_CONFIG, ...block.props } : DEFAULT_CONFIG;
    
    return Response.json({ config });
  } catch (error) {
    return Response.json({ error: "Konfigürasiya yüklənmədi" }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await request.json();

    let block = await prisma.dynamicBlock.findFirst({
      where: { page: "system", type: "admin_config" }
    });

    const currentConfig = block ? { ...DEFAULT_CONFIG, ...block.props } : DEFAULT_CONFIG;
    const nextConfig = { ...currentConfig, ...body };

    if (block) {
      await prisma.dynamicBlock.update({
        where: { id: block.id },
        data: { props: nextConfig }
      });
    } else {
      await prisma.dynamicBlock.create({
        data: {
          page: "system",
          type: "admin_config",
          props: nextConfig
        }
      });
    }

    // Also sync social media & contacts to siteText table for universal frontend sync
    const siteTextUpdates = [
      { key: "footer.facebookUrl", val: nextConfig.facebook || "" },
      { key: "footer.instagramUrl", val: nextConfig.instagram || "" },
      { key: "footer.whatsappPhone", val: nextConfig.whatsapp || "" },
      { key: "footer.tiktokUrl", val: nextConfig.tiktok || "" },
      { key: "footer.telegramUrl", val: nextConfig.telegram || "" },
      { key: "footer.youtubeUrl", val: nextConfig.youtube || "" },
      { key: "footer.phone", val: nextConfig.phone || "" },
      { key: "footer.email", val: nextConfig.email || "" },
      { key: "footer.address", val: nextConfig.address || "" },
    ];

    for (const item of siteTextUpdates) {
      if (item.val) {
        await prisma.siteText.upsert({
          where: { key: item.key },
          update: { valueAz: item.val, valueEn: item.val, valueRu: item.val },
          create: {
            key: item.key,
            group: "footer",
            label: item.key,
            valueAz: item.val,
            valueEn: item.val,
            valueRu: item.val,
            isActive: true
          }
        });
      }
    }

    // Sync promotion and boost pricing
    const promoUpdates = {
      tier_1_day: { id: "tier_1_day", name: "1 Günlük Elan", price: Number(nextConfig.tier_1_day_price ?? 0), days: 1, active: nextConfig.tier_1_day_active !== false, type: "LISTING_DURATION" },
      tier_15_days: { id: "tier_15_days", name: "15 Günlük Elan", price: Number(nextConfig.tier_15_days_price ?? 7), days: 15, active: nextConfig.tier_15_days_active !== false, type: "LISTING_DURATION" },
      tier_30_days: { id: "tier_30_days", name: "30 Günlük Elan", price: Number(nextConfig.tier_30_days_price ?? 15), days: 30, active: nextConfig.tier_30_days_active !== false, type: "LISTING_DURATION" },
      product_featured: { id: "product_featured", name: "Önə Çıxan Elan (FEATURED)", price: Number(nextConfig.product_featured_price ?? 5), days: 7, active: nextConfig.product_featured_active !== false, type: "PRODUCT_BOOST" },
      product_premium: { id: "product_premium", name: "Premium Elan (PREMIUM)", price: Number(nextConfig.product_premium_price ?? 10), days: 14, active: nextConfig.product_premium_active !== false, type: "PRODUCT_BOOST" },
      product_vip: { id: "product_vip", name: "VIP Vitrin & Baş Səhifə", price: Number(nextConfig.product_vip_price ?? 20), days: 30, active: nextConfig.product_vip_active !== false, type: "PRODUCT_BOOST" },
      product_banner: { id: "product_banner", name: "Baş Səhifə Reklam Banneri", price: Number(nextConfig.product_banner_price ?? 30), days: 14, active: nextConfig.product_banner_active !== false, type: "PRODUCT_BANNER" },
      store_verified_vip: { id: "store_verified_vip", name: "VIP Təsdiqlənmiş Mağaza", price: Number(nextConfig.store_verified_vip_price ?? 25), days: 30, active: nextConfig.store_verified_vip_active !== false, type: "STORE_BOOST" },
      store_banner_ad: { id: "store_banner_ad", name: "Mağaza Banner Reklamı", price: Number(nextConfig.store_banner_ad_price ?? 40), days: 30, active: nextConfig.store_banner_ad_active !== false, type: "STORE_BANNER" },
    };

    await prisma.dynamicBlock.upsert({
      where: { key: "promotion_pricing_config" },
      update: { props: promoUpdates, updatedAt: new Date() },
      create: { key: "promotion_pricing_config", type: "pricing_config", props: promoUpdates },
    });

    await prisma.dynamicBlock.upsert({
      where: { key: "listing_pricing_config" },
      update: {
        props: {
          tier_1_day: promoUpdates.tier_1_day,
          tier_15_days: promoUpdates.tier_15_days,
          tier_30_days: promoUpdates.tier_30_days,
        },
        updatedAt: new Date(),
      },
      create: {
        key: "listing_pricing_config",
        type: "pricing_config",
        props: {
          tier_1_day: promoUpdates.tier_1_day,
          tier_15_days: promoUpdates.tier_15_days,
          tier_30_days: promoUpdates.tier_30_days,
        },
      },
    });

    // Sync payment accounts config
    const paymentUpdates = {
      bankName: nextConfig.bankName || "ABB Bank / Kapital Bank",
      bankCardNumber: nextConfig.bankCardNumber || "4169 7388 1234 5678",
      bankCardHolder: nextConfig.bankCardHolder || "Fermer Market MMC",
      m10Number: nextConfig.m10Number || "+994 10 521 09 09",
      m10Holder: nextConfig.m10Holder || "Fermer Market",
      instructions: nextConfig.paymentInstructions || "Ödəniş etdikdən sonra qəbzin şəklini yükləyin.",
      allowCardTransfer: nextConfig.allowCardTransfer !== false,
      allowM10: nextConfig.allowM10 !== false,
      allowCash: nextConfig.allowCash !== false,
      allowWallet: nextConfig.allowWallet !== false,
    };

    await prisma.dynamicBlock.upsert({
      where: { key: "payment_accounts_config" },
      update: { props: paymentUpdates, updatedAt: new Date() },
      create: { key: "payment_accounts_config", type: "payment_config", props: paymentUpdates },
    });

    return Response.json({ success: true, config: nextConfig });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Konfigürasiya yenilənmədi" }, { status: 500 });
  }
}
