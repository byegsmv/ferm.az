/**
 * Applies pending migrations during the build.
 *
 * Replaces the shell chain that used to live in the build script. It resolves
 * the database URLs first, prints which server it is about to touch, retries a
 * couple of times for a cold or briefly unreachable database, and never fails
 * the build: a database problem must not stop the site from deploying.
 */

import { spawnSync } from "node:child_process";
import { applyDbEnv, describe } from "./resolve-db-env.mjs";

const resolved = applyDbEnv();

console.log(`db-migrate: DATABASE_URL -> ${describe(resolved.DATABASE_URL)}`);
console.log(`db-migrate: DIRECT_URL   -> ${describe(resolved.DIRECT_URL)}`);

if (!resolved.DATABASE_URL) {
  console.warn("db-migrate: no database URL configured, skipping migrations.");
  process.exit(0);
}

const delaysMs = [0, 8000, 15000];

for (let attempt = 0; attempt < delaysMs.length; attempt += 1) {
  if (delaysMs[attempt] > 0) {
    console.log(`db-migrate: retrying in ${delaysMs[attempt] / 1000}s...`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delaysMs[attempt]);
  }

  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status === 0) {
    console.log("db-migrate: migrations applied.");
    process.exit(0);
  }
}

console.warn(
  "db-migrate: could not apply migrations after 3 attempts - continuing so the site still deploys."
);
process.exit(0);
