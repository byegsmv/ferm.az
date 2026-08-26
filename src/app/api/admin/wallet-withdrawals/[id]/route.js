import { createNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { z } from "zod";

const decisionSchema = z.object({ action: z.enum(["approve", "reject"]) });

// PATCH /api/admin/wallet-withdrawals/:id
export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const { id } = await params;
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 }); }

  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "action 'approve' | 'reject' olmalıdır" }, { status: 422 });

  const tx = await prisma.walletTransaction.findUnique({ where: { id }, include: { wallet: true } });
  if (!tx || tx.type !== "WITHDRAWAL") return Response.json({ error: "Tələb tapılmadı" }, { status: 404 });
  if (tx.status !== "PENDING") return Response.json({ error: "Bu tələb artıq həll olunub" }, { status: 409 });

  if (parsed.data.action === "approve") {
    const updated = await prisma.walletTransaction.update({ where: { id }, data: { status: "COMPLETED" } });
    if (tx.wallet?.userId) {
      createNotification({
        userId: tx.wallet.userId,
        type: "wallet",
        title: "Çıxarış təsdiqləndi ✅",
        body: `₼${Number(tx.amount).toFixed(2)} çıxarış tələbiniz təsdiqləndi.`,
        link: "/dashboard",
      }).catch(() => {});
    }
    return Response.json({ transaction: updated });
  }

  // reject → refund
  const [, updated] = await prisma.$transaction([
    prisma.wallet.update({ where: { id: tx.walletId }, data: { balance: { increment: tx.amount } } }),
    prisma.walletTransaction.update({ where: { id }, data: { status: "REJECTED" } }),
  ]);

  if (tx.wallet?.userId) {
    createNotification({
      userId: tx.wallet.userId,
      type: "wallet",
      title: "Çıxarış rədd edildi ❌",
      body: `₼${Number(tx.amount).toFixed(2)} çıxarış tələbiniz rədd edildi. Balansınıza geri qaytarıldı.`,
      link: "/dashboard",
    }).catch(() => {});
  }
  return Response.json({ transaction: updated });
}
