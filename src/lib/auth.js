import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn("JWT secrets are not configured; using development fallback values.");
}

const ACCESS_TOKEN_TTL = "15m"; // changed from "365d" to "15m" for enhanced security
const REFRESH_TOKEN_TTL_DAYS = 30; // changed from 3650 to 30 days as standard best practice

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
    ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export function refreshTokenExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return d;
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the bearer token from a Next.js Request.
 * Returns the decoded payload or null.
 */
export function getAuthUser(request) {
  // 1. Try Authorization: Bearer header (client-side apiFetch)
  const authHeader = request.headers.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme === "Bearer" && token) {
    return verifyAccessToken(token);
  }

  // 2. Fallback: try HttpOnly cookie (set by server on login/refresh)
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)fmk_access_token=([^;]+)/);
  if (match) {
    return verifyAccessToken(match[1]);
  }

  return null;
}

/**
 * Role-based access guard. Usage inside a route handler:
 *   const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
 *   if (denied) return denied;
 */
/**
 * Generates a raw reset token (sent to the user) and its SHA-256 hash
 * (stored in DB). Never store the raw token — only the hash.
 */
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
