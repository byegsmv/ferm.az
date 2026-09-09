import { verifyPassword } from "@/lib/auth";

/**
 * Break-glass administrator login.
 *
 * When the database refuses every query — the provider's transfer quota is
 * spent, the compute is suspended, the network path is down — nobody can sign
 * in, including the person who has to fix it. This grants one pre-configured
 * administrator a session without touching the database.
 *
 * Deliberate constraints, all of them load-bearing:
 *   - Disabled unless BOTH env vars are set, so the repository never carries a
 *     usable credential and the path does not exist on an unconfigured deploy.
 *   - ADMIN_FALLBACK_PASSWORD_HASH holds a bcrypt hash, never a plain password.
 *   - It is consulted only AFTER a real database read has failed with a
 *     connection or quota error. While the database answers, this code is
 *     unreachable and the ordinary user record is the only way in.
 *   - The session it issues is deliberately short-lived.
 *
 * Generate the hash on your own machine and paste only the hash into the
 * hosting environment:
 *
 *   node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'your-password'
 */
export function isAdminFallbackConfigured() {
  return Boolean(process.env.ADMIN_FALLBACK_EMAIL && process.env.ADMIN_FALLBACK_PASSWORD_HASH);
}

export async function verifyAdminFallback(login, password) {
  if (!isAdminFallbackConfigured()) return null;
  if (typeof login !== "string" || typeof password !== "string" || !password) return null;

  const configured = process.env.ADMIN_FALLBACK_EMAIL.trim().toLowerCase();
  if (login.trim().toLowerCase() !== configured) return null;

  const ok = await verifyPassword(password, process.env.ADMIN_FALLBACK_PASSWORD_HASH).catch(() => false);
  if (!ok) return null;

  return {
    id: process.env.ADMIN_FALLBACK_USER_ID || "fallback-admin",
    email: configured,
    fullName: process.env.ADMIN_FALLBACK_NAME || "Fallback Admin",
    role: "SUPER_ADMIN",
    locale: "AZ",
    status: "ACTIVE",
  };
}
