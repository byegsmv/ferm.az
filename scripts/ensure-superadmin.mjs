/**
 * Creates the first SUPER_ADMIN during deployment, once.
 *
 * Runs as part of the build, right after the migrations. It is deliberately
 * quiet and never fails the build:
 *
 *   - Does nothing unless SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are both set.
 *   - Does nothing if a SUPER_ADMIN already exists, so a redeploy cannot reset
 *     anyone's password or re-grant access.
 *   - Any database problem is reported and swallowed. A fresh database that is
 *     briefly unreachable must not block a deploy.
 *
 * Set the two variables in the hosting environment, deploy once, then remove
 * them so the password stops travelling with every build.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { applyDbEnv } from "./resolve-db-env.mjs";

// The hosting integration may name the connection string something other than
// DATABASE_URL; normalise before anything reads it.
applyDbEnv();

const email = (process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD || "";
const fullName = process.env.SUPERADMIN_NAME || "Super Admin";
const username = process.env.SUPERADMIN_USERNAME || "admin";

if (!email || !password) {
  console.log("ensure-superadmin: SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD not set, skipping.");
  process.exit(0);
}
if (password.length < 8) {
  console.warn("ensure-superadmin: password shorter than 8 characters, skipping.");
  process.exit(0);
}

const url = process.env.DATABASE_URL || "";

async function buildClient() {
  if (/\.neon\.tech/i.test(url)) {
    const [{ Pool, neonConfig }, { PrismaNeon }, ws] = await Promise.all([
      import("@neondatabase/serverless"),
      import("@prisma/adapter-neon"),
      import("ws").then((m) => m.default || m),
    ]);
    neonConfig.webSocketConstructor = ws;
    neonConfig.poolQueryViaFetch = true;
    return new PrismaClient({ adapter: new PrismaNeon(new Pool({ connectionString: url })) });
  }
  return new PrismaClient();
}

let prisma;
try {
  prisma = await buildClient();

  const existingAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true } });
  if (existingAdmin) {
    console.log("ensure-superadmin: a SUPER_ADMIN already exists, leaving it untouched.");
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const clash = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] }, select: { id: true } });

    if (clash) {
      await prisma.user.update({
        where: { id: clash.id },
        data: { passwordHash, role: "SUPER_ADMIN", status: "ACTIVE", emailVerified: true, isBanned: false },
      });
      console.log("ensure-superadmin: promoted the existing account to SUPER_ADMIN.");
    } else {
      await prisma.user.create({
        data: { email, username, fullName, passwordHash, role: "SUPER_ADMIN", status: "ACTIVE", emailVerified: true },
      });
      console.log("ensure-superadmin: created the first SUPER_ADMIN.");
    }
  }
} catch (error) {
  console.warn("ensure-superadmin: skipped -", error?.message || error);
} finally {
  await prisma?.$disconnect?.().catch(() => {});
}
