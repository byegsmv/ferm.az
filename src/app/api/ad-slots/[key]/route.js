import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { getAdSlotContent } from "@/lib/adSlots";
import { z } from "zod";

const updateSchema = z.object({
  mode: z.enum(["internal", "external", "off"]),
  campaignType: z
    .enum(["HOMEPAGE_BANNER", "CATEGORY_BANNER", "STORE_PROMOTION", "FLASH_SALE", "DAILY_DEAL", "SPONSORED_PRODUCT", "REGIONAL"])
    .optional()
    .nullable(),
  externalCode: z.string().max(20000).optional().nullable(),
});

// GET /api/ad-slots/:key — public: resolve ONE placement's content by key
// (used by client components like SideBanner that only need a single slot).
// Distinguishes "slot explicitly turned off / no live campaign" (content: null,
// slotExists: true) from "slot was never configured" (slotExists: false) so
// callers can decide whether to show a fallback placeholder.
export async function GET(request, { params }) {
  const { key } = await params;
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") || undefined;

  try {
    const existing = await prisma.adSlot.findUnique({ where: { key } });
    const content = await getAdSlotContent(key, { region });
    return Response.json({ slotExists: !!existing, content }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    return Response.json({ slotExists: false, content: null });
  }
}

// PATCH /api/ad-slots/:key — admin only: switch a placement between an
// internal campaign banner, a pasted external ad-network embed, or off.
// Creates the AdSlot row if it doesn't exist yet (upsert) so newly-introduced
// slot keys (e.g. SIDEBAR_LEFT/RIGHT) can be configured without a manual seed.
export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { key } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  if (parsed.data.mode === "external" && !parsed.data.externalCode?.trim()) {
    return Response.json({ error: "Xarici rejim üçün embed kodu tələb olunur" }, { status: 422 });
  }

  const existing = await prisma.adSlot.findUnique({ where: { key } });

  const updated = await prisma.adSlot.upsert({
    where: { key },
    update: {
      mode: parsed.data.mode,
      campaignType: parsed.data.mode === "internal" ? parsed.data.campaignType || existing?.campaignType : existing?.campaignType,
      externalCode: parsed.data.mode === "external" ? parsed.data.externalCode : existing?.externalCode,
    },
    create: {
      key,
      label: key.replace(/_/g, " "),
      mode: parsed.data.mode,
      campaignType: parsed.data.mode === "internal" ? parsed.data.campaignType || null : null,
      externalCode: parsed.data.mode === "external" ? parsed.data.externalCode : null,
    },
  });

  return Response.json({ slot: updated });
}
