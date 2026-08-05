import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/auth";
import { passwordResetRequestSchema } from "@/lib/validators";
import { sendPasswordResetEmail } from "@/lib/email";
import { sendSMS, generateOTP } from "@/lib/sms";
import { rateLimit } from "@/lib/rateLimit";

const RESET_TOKEN_TTL_MINUTES = 30;
const OTP_TTL_MINUTES = 10;

// Detect if a string looks like a phone number
function isPhone(str) {
  const cleaned = str.replace(/[\s\-()]/g, "");
  return /^(\+?\d{7,15})$/.test(cleaned);
}

// Normalize phone for matching: try all Azerbaijani formats
// +994102391705, 994102391705, 0102391705, 102391705 → all match each other
function phoneVariants(phoneInput) {
  const cleaned = phoneInput.replace(/[\s\-()]/g, "");
  const variants = new Set([cleaned]);
  const withoutPlus = cleaned.replace(/^\+/, "");
  if (withoutPlus !== cleaned) variants.add(withoutPlus);

  // +994XXXXXXXXX → 0XXXXXXXXX and 994XXXXXXXXX
  if (withoutPlus.startsWith("994")) {
    variants.add("0" + withoutPlus.slice(3));
  }
  // 0XXXXXXXXX → +994XXXXXXXXX and 994XXXXXXXXX
  if (withoutPlus.startsWith("0") && withoutPlus.length >= 8) {
    variants.add("+994" + withoutPlus.slice(1));
    variants.add("994" + withoutPlus.slice(1));
  }
  return [...variants];
}

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
  const viaPhone = isPhone(trimmed);

  // Build search conditions
  const searchConditions = [
    { email: { equals: trimmed, mode: "insensitive" } },
    { username: { equals: trimmed, mode: "insensitive" } },
  ];

  if (viaPhone) {
    for (const variant of phoneVariants(trimmed)) {
      searchConditions.push({ phone: variant });
    }
  }

  const user = await prisma.user.findFirst({
    where: { OR: searchConditions },
    select: { id: true, email: true, phone: true, fullName: true },
  });

  if (!user) {
    return Response.json({
      message: "Əgər bu məlumat sistemdə varsa, sıfırlama təlimatları göndərilmişdir.",
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fermermarket.az";

  // === PHONE-BASED RESET (SMS OTP) ===
  if (viaPhone && user.phone) {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: otp, expiresAt },
    });

    const smsResult = await sendSMS({
      to: user.phone,
      message: `FermerMarket: Sifre yenileme kodunuz: ${otp}. Bu kod ${OTP_TTL_MINUTES} deqiqe erzinde etibarlidir.`,
    });

    if (smsResult.skipped && user.email) {
      const resetUrl = `${appUrl}/reset-password?token=${otp}&phone=1`;
      await sendPasswordResetEmail({ to: user.email, resetUrl });
      return Response.json({
        message: "SMS xidmeti hazir deyil. Sifirlama linki e-poct unvaniniza gonderilmisdir.",
        method: "email_fallback",
      });
    }

    return Response.json({
      message: `Sifre yenileme kodu ${user.phone} nomresine SMS olaraq gonderildi.`,
      method: "sms",
      otpRequired: true,
    });
  }

  // === EMAIL-BASED RESET (reset link) ===
  if (!user.email) {
    return Response.json({
      message: "Bu istifadecinin e-poct unvani yoxdur. Zehmet olmasa administrasiya ile elaqe saxlayin.",
    });
  }

  const { rawToken, tokenHash } = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail({ to: user.email, resetUrl });

  return Response.json({
    message: "Sifirlama linki e-poct unvaniniza gonderilmisdir.",
    method: "email",
  });
}
