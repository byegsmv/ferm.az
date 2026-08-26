import { getAuthUser, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/wallet/withdraw/reject — admin rejects a pending withdrawal and refunds balance
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  const { transactionId, reason } = await request.json();
  if (!transactionId) return Response.json({ error: 'transactionId tələb olunur' }, { status: 422 });

  const tx = await prisma.walletTransaction.findUnique({
    where: { id: transactionId },
    include: { wallet: true },
  });
  if (!tx) return Response.json({ error: 'Əməliyyat tapılmadı' }, { status: 404 });
  if (tx.type !== 'WITHDRAWAL' || tx.status !== 'PENDING') {
    return Response.json({ error: 'Bu əməliyyat artıq emal edilib' }, { status: 422 });
  }

  // Reject the withdrawal + refund balance + create refund transaction
  await prisma.$transaction([
    prisma.walletTransaction.update({
      where: { id: transactionId },
      data: { status: 'REJECTED', description: `Rədd edildi${reason ? ': ' + reason : ''}` },
    }),
    prisma.wallet.update({
      where: { id: tx.walletId },
      data: { balance: { increment: tx.amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: tx.walletId,
        type: 'REFUND',
        status: 'COMPLETED',
        amount: tx.amount,
        description: `Çıxarış sor­ğusu rədd edildi — məbləğ geri qaytarıldı${reason ? ': ' + reason : ''}`,
      },
    }),
  ]);

  return Response.json({ success: true });
}
