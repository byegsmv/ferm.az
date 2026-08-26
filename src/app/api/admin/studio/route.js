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

    return Response.json({ success: true, config: nextConfig });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Konfigürasiya yenilənmədi" }, { status: 500 });
  }
}
