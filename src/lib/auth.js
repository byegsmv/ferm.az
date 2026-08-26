import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export function validateJwtSecrets() {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error(
      "CRITICAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables. Never use fallback secrets in production!"
    );
  }

  if (accessSecret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be at least 32 characters long.");
  }

  if (refreshSecret.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be at least 32 characters long.");
  }

  return { accessSecret, refreshSecret };
}

function getAccessSecret() {
  return validateJwtSecrets().accessSecret;
}

function getRefreshSecret() {
  return validateJwtSecrets().refreshSecret;
}

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    getAccessSecret(),
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, getRefreshSecret(), {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export function refreshTokenExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return d;
}

export function verifyAccessToken(token) {
  const secret = getAccessSecret();
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  const secret = getRefreshSecret();
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the bearer token from a Next.js Request.
 * Returns the decoded payload or null.
 */
export async function getAuthUser(request) {
  // 1. Try Authorization: Bearer header (client-side apiFetch)
  const authHeader = request.headers.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");
  let payload = null;
  if (scheme === "Bearer" && token) {
    payload = verifyAccessToken(token);
  }

  // 2. Fallback: try HttpOnly cookie (set by server on login/refresh)
  if (!payload) {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)fmk_access_token=([^;]+)/);
    if (match) {
      payload = verifyAccessToken(match[1]);
    }
  }

  if (!payload) return null;

  // Always look up the user's current role from the DB — the JWT's role
  // field is a snapshot from sign time and can be stale if an admin changed
  // the role since the token was issued. This ensures role changes take
  // effect on the user's very next API call, no logout needed.
  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, email: true, status: true, isBanned: true },
    });
    if (!user) return null;
    if (user.status === "BANNED" || user.isBanned) return null;
    return { ...payload, role: user.role, email: user.email };
  } catch {
    // If DB is unreachable, fall back to JWT payload (better than blocking all APIs)
    return payload;
  }
}

export function generatePasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

export function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function requireRole(authUser, allowedRoles) {
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!allowedRoles.includes(authUser.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

export const getTokenFromRequest = getAuthUser;
export const verifyToken = verifyAccessToken;
