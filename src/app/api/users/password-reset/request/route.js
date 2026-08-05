import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/auth";
import { passwordResetRequestSchema } from "@/lib/validators";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";

const RESET_TOKEN_TTL_MINUTES = 30;

export async function POST(request) {
  // Apply rate limiting: 5 attempts / hour
  const rl = rateLimit(request, { limit: 5, windowMs: 60 * 60_000, keyPrefix: "pwd_reset" });
  if (rl) return rl;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = passwordResetRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Düzgün məlumat daxil edin" }, { status: 422 });
  }

  const { identifier } = parsed.data;
  const trimmed = identifier.trim();

  // Find user by email, phone, or username (case-insensitive for email/username)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: trimmed, mode: "insensitive" } },
        { phone: trimmed },
        { username: { equals: trimmed, mode: "insensitive" } },
      ],
    },
    select: { id: true, email: true },
  });

  // Always return 200 to prevent account enumeration
  if (!user || !user.email) {
    return Response.json({ message: "Əgər bu məlumat sistemdə varsa, sıfırlama linki göndərilmişdir." });
  }

  const { rawToken, tokenHash } = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  // Invalidate previous tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fermermarket.az";
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail({ to: user.email, resetUrl });

  return Response.json({ message: "Sıfırlama linki e-poçt ünvanınıza göndərilmişdir." });
}
