/**
 * Runtime environment fallback.
 *
 * On Vercel, the runtime process.env is populated ONLY from the dashboard
 * Environment Variables. The committed .env.production file is read by
 * Next.js at BUILD time (and by the build's migrate script), but it is NOT
 * present in the serverless runtime — so a deployment whose dashboard env
 * was cleaned ends up with no DATABASE_URL and no JWT secrets at runtime,
 * which took the whole site down (products API returned the offline stub,
 * login returned DB_NOT_CONFIGURED, 2026-09-10 incident).
 *
 * This module guarantees the three runtime-critical values are always
 * present, sourced from the same values committed in .env.production
 * (private repo). Real environment variables (Vercel dashboard) always
 * take precedence — these are only last-resort defaults.
 */

const FALLBACKS = {
  DATABASE_URL:
    "postgresql://neondb_owner:npg_ybt4FJuS7GKz@ep-rough-salad-b2j3zdyw-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  DIRECT_URL:
    "postgresql://neondb_owner:npg_ybt4FJuS7GKz@ep-rough-salad-b2j3zdyw.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  JWT_ACCESS_SECRET:
    "393554fc3308d17483775921a5ce96ec5cac0faae853a3d818c40f38e68366e9",
  JWT_REFRESH_SECRET:
    "9d1929f23fcca0a3d6a885ba20f7ce434e2b3a6c54b3396b04ad4db214f2a576",
};

export function ensureRuntimeEnv() {
  for (const [name, value] of Object.entries(FALLBACKS)) {
    if (!process.env[name]) {
      process.env[name] = value;
    }
  }
}

ensureRuntimeEnv();
