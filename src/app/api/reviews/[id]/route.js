import { createNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// PATCH /api/reviews/:id  { isApproved: true/false }  — admin moderation
export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const { id } = await params;
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 }); }

  const review = await prisma.review.update({
    where: { id },
    data: { isApproved: Boolean(body.isApproved) },
    include: { author: { select: { fullName: true } }, product: { select: { titleAz: true } } },
  });

  if (body.isApproved) {
    await createNotification(review.authorId, {
      title: "Rəy Təsdiqləndi",
      message: `Siz yazılan "${review.product.titleAz}" haqqında rəy təsdiqləndi.`,
      link: `/products/${review.productId}`,
    });
  }

  return Response.json({ review });
}

// DELETE /api/reviews/:id — admin deletion
export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN", "MODERATOR"]);
  if (denied) return denied;

  const { id } = await params;
  const review = await prisma.review.delete({ where: { id } });

  return Response.json({ success: true, id: review.id });
}
