// Vercel build wrapper (ferm-az) — build adımlarını aynen çalıştırır; bir adım
// hata verirse son ~8KB logu capture endpoint'ine POSTlar ki hata metni Vercel
// panel erişimi olmadan okunabilsin. Capture başarısız olsa bile build'in
// normal davranışı değişmez (hata yine build'i düşürür).
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const CAPTURE_URL = "https://test-5da814d7.base44.app/functions/captureVercelBuildLog";
const SHA = process.env.VERCEL_GIT_COMMIT_SHA || "local-" + Date.now();

let tail = "";

function run(cmd, fatal) {
  console.log("[build-capture] $ " + cmd);
  const r = spawnSync(cmd, {
    shell: true,
    stdio: ["inherit", "pipe", "pipe"],
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    env: process.env,
  });
  const out = (r.stdout || "") + (r.stderr || "");
  tail = (tail + "\n" + out).slice(-8192);
  process.stdout.write(out);
  if (r.error) {
    console.error("[build-capture] spawn error:", r.error.message);
    if (fatal) fail(cmd, 1);
    return 1;
  }
  if (fatal && r.status !== 0) fail(cmd, r.status);
  return r.status;
}

function fail(step, code) {
  try {
    fs.writeFileSync("/tmp/build-capture.json", JSON.stringify({ sha: SHA, step, tail }));
    spawnSync(
      'curl -s -m 20 -X POST -H "Content-Type: application/json" --data-binary @/tmp/build-capture.json ' + CAPTURE_URL,
      { shell: true, stdio: "ignore", timeout: 25000 }
    );
  } catch (e) { /* capture hata verse de build yine düşer */ }
  console.error("[build-capture] FAILED step:", step, "exit", code);
  process.exit(code || 1);
}

run("prisma generate", true);
run("node scripts/db-migrate.mjs", false);         // guard: xətada davam
run("node scripts/ensure-superadmin.mjs", false);  // guard: xətada davam
run("next build", true);
