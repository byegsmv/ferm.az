import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  mode: z.enum(["internal", "external", "off"]),
  campaignType: z
    .enum(["HOMEPAGE_BANNER", "CATEGORY_BANNER", "STORE_PROMOTION", "FLASH_SALE", "DAILY_DEAL", "SPONSORED_PRODUCT", "REGIONAL"])
    .optional()
    .nullable(),
  externalCode: z.string().max(20000).optional().nullable(),
});

// PATCH /api/ad-slots/:key — admin only: switch a placement between an
// internal campaign banner, a pasted external ad-network embed, or off.
export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { key } = await params;
  const existing = await prisma.adSlot.findUnique({ where: { key } });
  if (!existing) return Response.json({ error: "Reklam yeri tapılmadı" }, { status: 404 });

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

  const updated = await prisma.adSlot.update({
    where: { key },
    data: {
      mode: parsed.data.mode,
      campaignType: parsed.data.mode === "internal" ? parsed.data.campaignType || existing.campaignType : existing.campaignType,
      externalCode: parsed.data.mode === "external" ? parsed.data.externalCode : existing.externalCode,
    },
  });

  return Response.json({ slot: updated });
}
