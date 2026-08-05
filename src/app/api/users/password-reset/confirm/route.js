import { prisma } from "@/lib/prisma";
import { hashResetToken, hashPassword } from "@/lib/auth";
import { passwordResetConfirmSchema } from "@/lib/validators";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = passwordResetConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { token, newPassword } = parsed.data;

  // Try OTP match first (6-digit code from SMS)
  const isOTP = /^\d{6}$/.test(token);
  let resetRecord = null;

  if (isOTP) {
    // Phone-based OTP: match the OTP directly as tokenHash
    resetRecord = await prisma.passwordResetToken.findFirst({
      where: { tokenHash: token },
    });
  } else {
    // Email-based link: match the hashed token
    const tokenHash = hashResetToken(token);
    resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
    return Response.json({ error: "Bərpa linki və ya kod etibarsızdır, və ya müddəti bitib" }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    }),
    // Invalidate all existing refresh tokens on password change
    prisma.refreshToken.updateMany({
      where: { userId: resetRecord.userId },
      data: { revoked: true },
    }),
  ]);

  return Response.json({ message: "Şifrə uğurla yeniləndi. Yenidən daxil olun." });
}
