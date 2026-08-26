import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken, signRefreshToken, refreshTokenExpiryDate } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";

export async function POST(request) {
  // Apply requested rate limiting: 3 attempts / hour (60 * 60_000 ms)
  const rl = rateLimit(request, { limit: 3, windowMs: 60 * 60_000, keyPrefix: "register" });
  if (rl) return rl;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { email, username, password, fullName, phone, locale } = parsed.data;
  const role = "BUYER"; // Force default role — no role selection

  const cleanEmail = email?.trim() || null;
  const cleanPhone = phone?.trim() || null;
  const cleanUsername = username?.trim() || null;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        cleanEmail ? { email: cleanEmail } : null,
        cleanPhone ? { phone: cleanPhone } : null,
        cleanUsername ? { username: cleanUsername } : null,
      ].filter(Boolean)
    }
  });

  if (existing) {
    if (cleanEmail && existing.email === cleanEmail) return Response.json({ error: "Bu e-poçt artıq qeydiyyatdan keçib" }, { status: 409 });
    if (cleanPhone && existing.phone === cleanPhone) return Response.json({ error: "Bu telefon nömrəsi artıq qeydiyyatdan keçib" }, { status: 409 });
    if (cleanUsername && existing.username === cleanUsername) return Response.json({ error: "Bu istifadəçi adı artıq qeydiyyatdan keçib" }, { status: 409 });
    return Response.json({ error: "Bu istifadəçi artıq mövcuddur" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      phone: cleanPhone,
      username: cleanUsername,
      passwordHash,
      fullName,
      role,
      locale,
      status: "PENDING_VERIFICATION",
      wallet: {
        create: {
          coins: 50,
          transactions: {
            create: [
              {
                type: "COIN_GIFT",
                amount: 50,
                description: "Qeydiyyat hədiyyəsi",
              },
            ],
          },
        },
      },
    },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_REGISTERED",
      entity: "User",
      entityId: user.id,
      metadata: { details: `Registered from IP: ${ip}` },
    },
  });

  // Fire-and-forget welcome email if email exists
  if (user.email) {
    sendWelcomeEmail({ to: user.email, fullName: user.fullName }).catch(() => {});
  }

  const res = Response.json(
    {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        locale: user.locale,
        status: user.status,
      },
      accessToken,
      refreshToken,
    },
    { status: 201 }
  );
  res.headers.set("Set-Cookie", `fmk_access_token=${accessToken}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`);
  return res;
}
