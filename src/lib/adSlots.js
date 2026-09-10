import { prisma } from "@/lib/prisma";

/**
 * Server-side resolver for a single ad placement. Call from a page/server
 * component and pass the result into <AdBanner content={...} /> (client)
 * for rendering + impression/click tracking.
 *
 * Returns null if the slot is off, misconfigured, or (internal mode) has
 * no matching active campaign right now — callers should render nothing.
 */
export async function getAdSlotContent(key, { region } = {}) {
  try {
    const slot = await prisma.adSlot.findUnique({ where: { key } });
    if (!slot || slot.mode === "off") return null;

    if (slot.mode === "external") {
      if (!slot.externalCode) return null;
      return { mode: "external", externalCode: slot.externalCode };
    }

    // mode === "internal" — pull a live campaign of the configured type
    const now = new Date();
    const campaign = await prisma.campaign.findFirst({
      where: {
        status: "ACTIVE",
        type: slot.campaignType || undefined,
        startDate: { lte: now },
        endDate: { gte: now },
        ...(region ? { OR: [{ region }, { region: null }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { store: { select: { name: true, slug: true } } },
    });

    if (!campaign) return null;

    return {
      mode: "internal",
      campaign: {
        id: campaign.id,
        title: campaign.title,
        bannerUrl: campaign.bannerUrl,
        targetUrl: campaign.targetUrl || (campaign.store ? `/stores/${campaign.store.slug}` : "/products"),
        storeName: campaign.store?.name || null,
      },
    };
  } catch (err) {
    console.warn(`⚠️ adSlots: Qoşulma alınmadı (Lokal/Sərbəst rejim), key=${key}`);
    return null;
  }
}

/**
 * Sol/sağ yan rayların vəziyyəti + reklam üçün WhatsApp linki.
 * - on: slot mövcuddur və mode !== "off"
 * - content: aktiv kampaniya varsa onun banneri, yoxdursa null
 *   (null olduqda SideAdRails "Burada sizin reklamınız ola bilər"
 *   WhatsApp yönləndirmə kartını göstərir)
 */
export async function getSidebarRails() {
  try {
    const [leftSlot, rightSlot, waText] = await Promise.all([
      prisma.adSlot.findUnique({ where: { key: "SIDEBAR_LEFT" } }),
      prisma.adSlot.findUnique({ where: { key: "SIDEBAR_RIGHT" } }),
      prisma.siteText.findUnique({ where: { key: "footer.whatsappPhone" } }),
    ]);
    const waPhone = (waText?.valueAz || "+994 10 521 09 09").replace(/[^\d]/g, "");
    const waMsg = encodeURIComponent("Salam! FermerMarket-də reklam yerləşdirmək istəyirəm.");
    const whatsappUrl = `https://wa.me/${waPhone}?text=${waMsg}`;

    return {
      left: {
        on: !!leftSlot && leftSlot.mode !== "off",
        content: leftSlot && leftSlot.mode !== "off" ? await getAdSlotContent("SIDEBAR_LEFT") : null,
      },
      right: {
        on: !!rightSlot && rightSlot.mode !== "off",
        content: rightSlot && rightSlot.mode !== "off" ? await getAdSlotContent("SIDEBAR_RIGHT") : null,
      },
      whatsappUrl,
    };
  } catch (err) {
    console.warn("⚠️ adSlots: sidebar rayları yüklənmədi:", err?.message);
    return { left: { on: false, content: null }, right: { on: false, content: null }, whatsappUrl: "" };
  }
}
