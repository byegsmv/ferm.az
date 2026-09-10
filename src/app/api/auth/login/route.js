import { rateLimit } from "@/lib/rateLimit";
import { prisma, withDbRetry, isDbConnectionError, isDbQuotaError, isDatabaseConfigured } from "@/lib/prisma";
import { verifyPassword, signAccessToken, signRefreshToken, refreshTokenExpiryDate } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { verifyAdminFallback } from "@/lib/adminFallback";

export async function POST(request) {
  // Apply requested rate limiting: 5 attempts / 15 min
  const rl = rateLimit(request, { limit: 5, windowMs: 15 * 60_000, keyPrefix: "login" });
  if (rl) {
    // Log failed attempts due to rate limiting
    try {
      const body = await request.clone().json().catch(() => ({}));
      const login = body.login || "unknown";
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";
      await prisma.auditLog.create({
        data: {
          action: "FAILED_LOGIN_RATE_LIMIT",
          entity: "User",
          metadata: { details: `Failed login attempt (rate limited) for login: ${login} from IP: ${ip}` },
        },
      }).catch(() => {});
    } catch {}
    return rl;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { login, password } = parsed.data;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";

  // With no database configured, prisma is the offline stub: the lookup below
  // would return nothing and this route would call that a wrong password. Say
  // what is actually wrong instead.
  if (!isDatabaseConfigured()) {
    console.error("Login attempted with no DATABASE_URL configured.");
    return Response.json({
      error: "Verilənlər bazası konfiqurasiya olunmayıb (DATABASE_URL boşdur). Sayt idarəçisi ilə əlaqə saxlayın.",
      code: "DB_NOT_CONFIGURED"
    }, { status: 503 });
  }

  let user;
  try {
    user = await withDbRetry(() =>
      prisma.user.findFirst({
        where: {
          OR: [
            { email: login },
            { phone: login },
            { username: login },
          ]
        }
      })
    );
  } catch (error) {
    console.error("Database connection error in login:", error);

    // The database is unreachable, so nobody can sign in — including whoever
    // has to fix it. Let the pre-configured break-glass administrator through.
    const fallbackAdmin = await verifyAdminFallback(login, password);
    if (fallbackAdmin) {
      console.warn("Break-glass admin login used while the database is unavailable, from IP:", ip);
      const token = signAccessToken(fallbackAdmin);
      const res = Response.json({
        user: {
          id: fallbackAdmin.id,
          email: fallbackAdmin.email,
          fullName: fallbackAdmin.fullName,
          role: fallbackAdmin.role,
          locale: fallbackAdmin.locale,
          status: fallbackAdmin.status,
        },
        accessToken: token,
        refreshToken: null,
        degraded: true,
        notice:
          "Verilənlər bazası əlçatmazdır. Məhdud rejimdə giriş edildi, məlumat tələb edən səhifələr boş görünəcək.",
      });
      res.headers.set(
        "Set-Cookie",
        // Matches the access token's own 15 minute lifetime. There is no
        // refresh path while the database is down, so re-login is expected.
        `fmk_access_token=${token}; Path=/; Max-Age=900; SameSite=Lax; HttpOnly`
      );
      return res;
    }

    if (isDbQuotaError(error)) {
      return Response.json({
        error: "Verilənlər bazası provayderinin limiti (kvotası) tükənib, ona görə baza cavab vermir. Sayt idarəçisi verilənlər bazası tarifini yeniləməlidir.",
        code: "DB_QUOTA"
      }, { status: 503 });
    }
    if (isDbConnectionError(error)) {
      return Response.json({
        error: "Verilənlər bazası müvəqqəti əlçatmazdır. Bir neçə saniyədən sonra yenidən cəhd edin.",
        code: "DB_CONN"
      }, { status: 503 });
    }
    return Response.json({
      error: "Giriş zamanı server xətası baş verdi. Bir az sonra yenidən cəhd edin.",
      code: "DB_ERROR"
    }, { status: 500 });
  }

  if (!user) {
    await prisma.auditLog.create({
      data: {
        action: "FAILED_LOGIN",
        entity: "User",
        metadata: { details: `Non-existent user attempt for login: ${login} from IP: ${ip}` },
      },
    }).catch(() => {});
    return Response.json({ error: "İstifadəçi adı və ya şifrə yanlışdır" }, { status: 401 });
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "FAILED_LOGIN",
        entity: "User",
        entityId: user.id,
        metadata: { details: `Incorrect password attempt from IP: ${ip}` },
      },
    }).catch(() => {});
    return Response.json({ error: "İstifadəçi adı və ya şifrə yanlışdır" }, { status: 401 });
  }

  if (user.status === "SUSPENDED" || user.status === "BANNED") {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "FAILED_LOGIN_SUSPENDED",
        entity: "User",
        entityId: user.id,
        metadata: { details: `Suspended/banned user attempt from IP: ${ip}` },
      },
    }).catch(() => {});
    return Response.json({ error: "Hesabınız bloklanıb. Dəstək ilə əlaqə saxlayın." }, { status: 403 });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // A failure to persist the refresh token must not block a successful login:
  // the access token is already signed and valid, the user simply re-logs in
  // when it expires instead of silently refreshing.
  try {
    await withDbRetry(() =>
      prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: refreshTokenExpiryDate(),
        },
      })
    );
  } catch (error) {
    console.error("Could not persist refresh token for user", user.id, error?.message);
  }

  // Log successful login too
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      metadata: { details: `Successful login from IP: ${ip}` },
    },
  }).catch(() => {});

  const res = Response.json({
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
  });
  // Set cookie so middleware can verify auth on server-side
  res.headers.set("Set-Cookie", `fmk_access_token=${accessToken}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`);
  return res;
}
