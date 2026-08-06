import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { campaignUpdateSchema } from "@/lib/validators";

export async function GET(request, { params }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { store: true, category: true },
  });
  if (!campaign) return Response.json({ error: "Kampaniya tapılmadı" }, { status: 404 });
  return Response.json({ campaign });
}

export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "BUYER"]);
  if (denied) return denied;

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id }, include: { store: true } });
  if (!campaign) return Response.json({ error: "Kampaniya tapılmadı" }, { status: 404 });

  const isOwner = campaign.store && campaign.store.ownerId === authUser.sub;
  const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = campaignUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Only Admin can force-activate; store owners can only pause/edit content
  if (parsed.data.status === "ACTIVE" && !isAdmin) {
    return Response.json({ error: "Yalnız Admin kampaniyanı aktivləşdirə bilər" }, { status: 403 });
  }

  const data = { ...parsed.data };
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  const updated = await prisma.campaign.update({ where: { id }, data });
  return Response.json({ campaign: updated });
}

export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return Response.json({ error: "Kampaniya tapılmadı" }, { status: 404 });

  await prisma.campaign.delete({ where: { id } });
  return Response.json({ success: true });
}
