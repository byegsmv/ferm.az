import { prisma } from "@/lib/prisma";
import { z } from "zod";

const trackSchema = z.object({
  event: z.enum(["impression", "click", "conversion"]),
});

// POST /api/campaigns/:id/track — public, called by frontend on banner render/click
export async function POST(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "event 'impression' | 'click' | 'conversion' olmalıdır" }, { status: 422 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return Response.json({ error: "Kampaniya tapılmadı" }, { status: 404 });

  const fieldMap = {
    impression: "impressions",
    click: "clicks",
    conversion: "conversions",
  };
  const field = fieldMap[parsed.data.event];

  const updateData = { [field]: { increment: 1 } };

  // Deduct spend from budget on click, if CPC pricing is configured
  if (parsed.data.event === "click" && campaign.costPerClick) {
    updateData.spend = { increment: campaign.costPerClick };
  }

  const updated = await prisma.campaign.update({ where: { id }, data: updateData });

  // Auto-pause if budget exhausted
  if (updated.budget && Number(updated.spend) >= Number(updated.budget) && updated.status === "ACTIVE") {
    await prisma.campaign.update({ where: { id }, data: { status: "PAUSED" } });
  }

  return Response.json({ success: true });
}
