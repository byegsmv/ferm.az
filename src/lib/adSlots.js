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
