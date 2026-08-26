import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/ad-slots — public: every page's frontend reads this once to know,
// per placement key, whether to render an internal campaign banner, an
// external network embed (Google Ads/AdSense/etc), or nothing.
export async function GET(request) {
  let slots = [];
  try {
    slots = await prisma.adSlot.findMany({ orderBy: { key: "asc" } });
  } catch (error) {
    console.warn("adSlots: Qoşulma alınmadı (Lokal/Sərbəst rejim)", error.message);
    slots = [];
  }

  const { searchParams } = new URL(request.url);
  const includeCode = searchParams.get("includeCode") === "1";

  if (includeCode) {
    const authUser = await getAuthUser(request);
    if (!authUser || !["ADMIN", "SUPER_ADMIN"].includes(authUser.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const internalSlots = slots.filter((s) => s.mode === "internal");
    const campaignTypes = [...new Set(internalSlots.map((s) => s.campaignType).filter(Boolean))];

    let activeCampaigns = [];
    if (campaignTypes.length > 0) {
      try {
        activeCampaigns = await prisma.campaign.findMany({
          where: {
            status: "ACTIVE",
            type: { in: campaignTypes },
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { type: true, title: true },
        });
      } catch (error) {
        console.warn("adSlots campaigns: Qoşulma alınmadı", error.message);
      }
    }

    const campaignByType = {};
    for (const c of activeCampaigns) {
      if (!campaignByType[c.type]) campaignByType[c.type] = c;
    }

    const withLiveStatus = slots.map((s) => {
      if (s.mode !== "internal") return { ...s, hasLiveCampaign: null, liveCampaignTitle: null };
      const match = s.campaignType ? campaignByType[s.campaignType] : null;
      return { ...s, hasLiveCampaign: !!match, liveCampaignTitle: match?.title || null };
    });

    return Response.json({ slots: withLiveStatus });
  }

  return Response.json({
    slots: slots.map((s) => ({
      key: s.key,
      label: s.label,
      mode: s.mode,
      campaignType: s.campaignType,
      externalCode: s.mode === "external" ? s.externalCode : null,
    })),
  });
}
