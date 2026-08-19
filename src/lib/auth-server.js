import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * Server-component-safe auth helper.
 * Reads the access token from Next.js cookies() and returns the decoded
 * payload (or null) — no Request object needed.
 *
 * Usage in server components:
 *   const authUser = await getServerAuthUser();
 *   if (authUser?.sub) { ... }
 */
export async function getServerAuthUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fmk_access_token")?.value;
    if (!token || !ACCESS_SECRET) return null;
    return jwt.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
}
