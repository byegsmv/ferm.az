import { prisma } from "@/lib/prisma";

/**
 * Auto-Discovery Scanner
 * Frontend-dəki bütün t() və st() çağırışlarını scan edir,
 * database-də olmayan açarları tapır və auto-create edir.
 *
 * Kullanım:
 * 1. Build-time: npm run build-dan əvvəl çağırılır
 * 2. Runtime: Admin "Sync Translations" düyməsini basanda
 * 3. Cron: Hər gecə avtomatik scan
 */
export async function discoverAndSyncMissingKeys() {
  const fs = await import("fs");
  const path = await import("path");

  const srcDir = path.join(process.cwd(), "src");
  const keys = new Map();

  // Scan all JS/JSX files
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        scanDir(full);
      } else if (entry.name.endsWith(".js") || entry.name.endsWith(".jsx")) {
        const content = fs.readFileSync(full, "utf-8");
        // Match t('key', 'fallback') and st("key", "fallback")
        const tRegex = /\b(?:t|st)\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*?)['"]\s*\)/g;
        let match;
        while ((match = tRegex.exec(content)) !== null) {
          const key = match[1];
          const fallback = match[2];
          if (!keys.has(key)) {
            keys.set(key, { fallback, sourceFile: full.replace(srcDir + path.sep, "") });
          }
        }
      }
    }
  }

  scanDir(srcDir);

  // Check which keys are missing in DB
  const existingKeys = await prisma.siteText.findMany({
    select: { key: true, valueAz: true },
  });
  const existingKeySet = new Set(existingKeys.map((k) => k.key));

  const missing = [];
  const outdated = [];

  for (const [key, info] of keys) {
    if (!existingKeySet.has(key)) {
      const parts = key.split(".");
      missing.push({
        key,
        group: parts[0],
        label: parts.slice(1).join("."),
        valueAz: info.fallback,
        sourceFile: info.sourceFile,
      });
    } else {
      // Check if fallback changed
      const existing = existingKeys.find((k) => k.key === key);
      if (existing && existing.valueAz !== info.fallback) {
        outdated.push({ key, oldFallback: existing.valueAz, newFallback: info.fallback });
      }
    }
  }

  // Auto-create missing keys
  let created = 0;
  for (const item of missing) {
    try {
      await prisma.siteText.create({
        data: {
          key: item.key,
          group: item.group,
          label: item.label,
          valueAz: item.valueAz,
          valueEn: null,
          valueRu: null,
          isActive: true,
        },
      });
      created++;
    } catch {
      // Skip duplicates
    }
  }

  // Update outdated fallbacks
  let updated = 0;
  for (const item of outdated) {
    await prisma.siteText.update({
      where: { key: item.key },
      data: { valueAz: item.newFallback },
    });
    updated++;
  }

  return {
    totalScanned: keys.size,
    missing: missing.length,
    created,
    outdated: outdated.length,
    updated,
    missingKeys: missing,
    outdatedKeys: outdated,
  };
}

// API endpoint for manual sync
export async function POST(request) {
  const { prisma: db } = await import("@/lib/prisma");
  const { getAuthUser, requireRole } = await import("@/lib/auth");

  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const result = await discoverAndSyncMissingKeys();

  return Response.json(result);
}
