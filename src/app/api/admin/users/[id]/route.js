import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole, hashPassword } from "@/lib/auth";
import { adminUserUpdateSchema } from "@/lib/validators";

export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { id } = await params;

  // Only SUPER_ADMIN can promote/demote to ADMIN or SUPER_ADMIN
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = adminUserUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  if (
    parsed.data.role &&
    ["ADMIN", "SUPER_ADMIN"].includes(parsed.data.role) &&
    authUser.role !== "SUPER_ADMIN"
  ) {
    return Response.json(
      { error: "Yalnız Super Admin bu rolu təyin edə bilər" },
      { status: 403 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return Response.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  // If newPassword is provided, hash it and replace passwordHash
  const { newPassword, ...updateData } = parsed.data;
  if (newPassword) {
    updateData.passwordHash = await hashPassword(newPassword);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, role: true, status: true, isBanned: true, fullName: true, phone: true, username: true },
  });

  // If role or status was changed, revoke all existing refresh tokens so the
  // user's next API call (after access token expires) gets a fresh token with
  // the updated role. This makes admin role changes take effect within ~15min.
  if (parsed.data.role || parsed.data.status || parsed.data.isBanned) {
    await prisma.refreshToken.updateMany({
      where: { userId: id, revoked: false },
      data: { revoked: true },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: authUser.sub,
      action: "ADMIN_USER_UPDATED",
      entity: "User",
      entityId: id,
      metadata: parsed.data,
    },
  });

  return Response.json({ user: updated });
}


// DELETE /api/admin/users/[id] — delete a user profile (ADMIN/SUPER_ADMIN only)
export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { id } = await params;

  // Prevent self-deletion
  if (id === authUser.sub) {
    return Response.json({ error: "Öz profilinizi silə bilməzsiniz" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return Response.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });

  // Prevent deleting another SUPER_ADMIN unless you are SUPER_ADMIN
  if (target.role === "SUPER_ADMIN" && authUser.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Yalnız Super Admin digər Super Admin-i silə bilər" }, { status: 403 });
  }

  // Most relations (Review, Favorite, Wallet, Conversation, Store, Bundle, BlogPost,
  // PushSubscription, Notification, UserModule, FarmerProfile, AgroServiceRequest,
  // RefreshToken, PasswordResetToken) already cascade automatically via the Prisma
  // schema's onDelete: Cascade. We only need to manually clear the relations that
  // have NO onDelete action defined (Product.sellerId, Order.buyerId,
  // Order.deliveryPartnerId, OrderItem.sellerId) — otherwise Postgres would reject
  // the user delete with a foreign-key constraint error.
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Remove this user as seller from any OrderItem (their sales history on
      //    OTHER buyers' orders) — required field, cannot be nulled, must delete.
      await tx.orderItem.deleteMany({ where: { sellerId: id } });

      // 2. Clear delivery-partner assignment on orders where this user only
      //    delivered (not their own order) — optional field, safe to null out.
      await tx.order.updateMany({ where: { deliveryPartnerId: id }, data: { deliveryPartnerId: null } });

      // 3. Delete this user's own orders (as buyer) — cascades OrderItem + Payment.
      await tx.order.deleteMany({ where: { buyerId: id } });

      // 4. Delete this user's own product listings (no onDelete on sellerId).
      await tx.product.deleteMany({ where: { sellerId: id } });

      // 5. Delete the user — cascades Store, Review, Favorite, Wallet, Bundle,
      //    BlogPost, Conversation, PushSubscription, Notification, UserModule,
      //    FarmerProfile, AgroServiceRequest, RefreshToken, PasswordResetToken.
      //    AuditLog.userId is onDelete:SetNull, preserving audit history.
      await tx.user.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: authUser.sub,
          action: "ADMIN_USER_DELETED",
          entity: "User",
          entityId: id,
          metadata: { deletedEmail: target.email, deletedName: target.fullName },
        },
      });
    });
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error);
    return Response.json({ error: "İstifadəçi silinərkən xəta baş verdi: " + (error.message || "naməlum xəta") }, { status: 500 });
  }

  return Response.json({ success: true });
}
