import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// Default config
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
  require2FA: false
};

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    let block = await prisma.dynamicBlock.findFirst({
      where: { page: "system", type: "admin_config" }
    });
    
    return Response.json({ config: block ? block.props : DEFAULT_CONFIG });
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

    const currentConfig = block ? block.props : DEFAULT_CONFIG;
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

    return Response.json({ success: true, config: nextConfig });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Konfigürasiya yenilənmədi" }, { status: 500 });
  }
}

