import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth";

// POST /api/auth/refresh
// Body: { refreshToken }
// Exchanges a still-valid, non-revoked refresh token for a new short-lived access token.
// This is the missing piece that was causing authenticated actions to silently be treated
// as anonymous/guest once the 15-minute access token expired (client kept stale cached
// user info while the server correctly rejected the expired token).
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { refreshToken } = body || {};
  if (!refreshToken) {
    return Response.json({ error: "refreshToken tələb olunur" }, { status: 400 });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return Response.json({ error: "Refresh token etibarsızdır və ya vaxtı bitib" }, { status: 401 });
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    return Response.json({ error: "Refresh token etibarsızdır və ya vaxtı bitib" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status === "SUSPENDED" || user.status === "BANNED") {
    return Response.json({ error: "Hesab tapılmadı və ya bloklanıb" }, { status: 401 });
  }

  const accessToken = signAccessToken(user);

  const res = Response.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      locale: user.locale,
      status: user.status,
    },
  });
  res.headers.set("Set-Cookie", `fmk_access_token=${accessToken}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`);
  return res;
}
