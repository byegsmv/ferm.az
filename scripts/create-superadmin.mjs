/**
 * Create or promote a SUPER_ADMIN account.
 *
 * Run it once the database answers again:
 *
 *   SUPERADMIN_EMAIL=info@fermermarket.az \
 *   SUPERADMIN_PASSWORD='choose-a-strong-one' \
 *   node scripts/create-superadmin.mjs
 *
 * The password is read from the environment on purpose — never pass it as an
 * argument (it lands in shell history) and never commit it.
 *
 * Existing account with that email: it is promoted to SUPER_ADMIN, activated,
 * and its password reset to the given one. Otherwise a new account is created.
 */

import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import ws from "ws";

const email = (process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD || "";
const fullName = process.env.SUPERADMIN_NAME || "Super Admin";
const username = process.env.SUPERADMIN_USERNAME || "admin";

if (!email || !password) {
  console.error("SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must both be set.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("SUPERADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const url = process.env.DATABASE_URL || "";
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

function buildClient() {
  if (/\.neon\.tech/i.test(url)) {
    neonConfig.webSocketConstructor = ws;
    neonConfig.poolQueryViaFetch = true;
    return new PrismaClient({ adapter: new PrismaNeon(new Pool({ connectionString: url })) });
  }
  return new PrismaClient();
}

const prisma = buildClient();

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, role: "SUPER_ADMIN", status: "ACTIVE", emailVerified: true, isBanned: false },
      select: { id: true, email: true, username: true, role: true, status: true },
    });
    console.log("Promoted existing account to SUPER_ADMIN:", updated);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        username,
        fullName,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerified: true,
      },
      select: { id: true, email: true, username: true, role: true, status: true },
    });
    console.log("Created SUPER_ADMIN:", created);
  }
} catch (error) {
  console.error("Failed:", error?.message || error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => {});
}
