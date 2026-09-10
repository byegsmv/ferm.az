// Vercel build wrapper (ferm-az) — build adımlarını aynen çalıştırır.
// HER adımın başlangıç/bitişini ve fatal hatalarda son ~8KB logu capture
// endpoint'ine POSTlar → build tam olarak nereye kadar geldiği ve hatanın
// metni Vercel panel erişimi olmadan okunabilir. Capture başarısız olsa
// bile build'in normal davranışı değişmez.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const CAPTURE_URL = "https://test-5da814d7.base44.app/functions/captureVercelBuildLog";
const SHA = process.env.VERCEL_GIT_COMMIT_SHA || "local-" + Date.now();

function report(step, extra) {
  try {
    fs.writeFileSync("/tmp/build-capture.json", JSON.stringify({
      sha: SHA, step, node: process.version, tail: String(extra || "").slice(-8192),
    }));
    spawnSync(
      'curl -s -m 20 -X POST -H "Content-Type: application/json" --data-binary @/tmp/build-capture.json ' + CAPTURE_URL,
      { shell: true, stdio: "ignore", timeout: 25000 }
    );
  } catch (e) { /* yut — build etkilenmez */ }
}

const steps = [
  { cmd: "prisma generate", fatal: true },
  { cmd: "node scripts/db-migrate.mjs", fatal: false },
  { cmd: "node scripts/ensure-superadmin.mjs", fatal: false },
  { cmd: "next build", fatal: true },
];

report("START node=" + process.version + " vercelEnv=" + (process.env.VERCEL_ENV || "local"));
let tail = "";
for (const s of steps) {
  console.log("[build-capture] $ " + s.cmd);
  report("STEP_BEGIN " + s.cmd);
  const r = spawnSync(s.cmd, {
    shell: true,
    stdio: ["inherit", "pipe", "pipe"],
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    env: process.env,
  });
  const out = (r.stdout || "") + (r.stderr || "");
  tail = (tail + "\n" + out).slice(-8192);
  process.stdout.write(out);
  const code = r.error ? 1 : (r.status === null ? 1 : r.status);
  if (s.fatal && code !== 0) {
    report("STEP_FAIL " + s.cmd, tail);
    console.error("[build-capture] FAILED:", s.cmd, "exit", code);
    process.exit(code || 1);
  }
  report("STEP_DONE " + s.cmd + " exit=" + code);
}
report("ALL_OK build finished");
