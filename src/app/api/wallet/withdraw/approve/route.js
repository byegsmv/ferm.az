import { getAuthUser, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/wallet/withdraw/approve — admin approves a pending withdrawal
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  const { transactionId } = await request.json();
  if (!transactionId) return Response.json({ error: 'transactionId tələb olunur' }, { status: 422 });

  const tx = await prisma.walletTransaction.findUnique({ where: { id: transactionId } });
  if (!tx) return Response.json({ error: 'Əməliyyat tapılmadı' }, { status: 404 });
  if (tx.type !== 'WITHDRAWAL' || tx.status !== 'PENDING') {
    return Response.json({ error: 'Bu əməliyyat artıq emal edilib' }, { status: 422 });
  }

  const updated = await prisma.walletTransaction.update({
    where: { id: transactionId },
    data: { status: 'COMPLETED' },
  });

  return Response.json({ success: true, transaction: updated });
}
