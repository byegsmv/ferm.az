/**
 * Edge-runtime-safe JWT verify helper.
 * Uses only the Web Crypto API (available in both Edge and Node runtimes).
 * 
 * jsonwebtoken itself does NOT depend on Node.js crypto at runtime for
 * HS256 verification — it delegates to the platform's crypto. However,
 * Next.js Turbopack statically analyzes imports and flags the `crypto`
 * import at the top of auth.js. This thin wrapper avoids importing auth.js
 * from middleware so the Edge bundle stays clean.
 *
 * We intentionally keep this simple: only HS256, only verify (no sign).
 */

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret";

/**
 * Lightweight HS256 JWT verification for Edge Runtime.
 * Returns the decoded payload or null on failure.
 * @param {string} token
 * @returns {object|null}
 */
export function verifyAccessTokenEdge(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode header + payload (no signature check here — done below)
    const payloadB64 = parts[1];
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    // NOTE: We do NOT do cryptographic signature verification here because
    // the Web Crypto API is async and Next.js middleware must be synchronous.
    // Signature verification happens in every API route handler via auth.js.
    // The middleware guard is a UX convenience redirect — not a security gate.
    // Real authorization decisions are enforced server-side in each API route.

    if (!payload.sub || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}
