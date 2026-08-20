/**
 * Rule-Based Code Generator (Gemini fallback)
 * GEMINI_API_KEY olmadan da işləyir.
 * Sadə əmrləri regex/shell template ilə handle edir.
 */

const TEMPLATES = {
  // "Yeni səhifə yarat" → new page template
  "yeni.*səhifə|new.*page|create.*page": {
    handler: "newPage",
  },
  // "Yeni kateqoriya" → new category
  "yeni.*kategori|new.*categor|create.*categor": {
    handler: "newCategory",
  },
  // "Mətn dəyişdir" → text replacement
  "mətn.*dəyiş|text.*change|replace.*text": {
    handler: "textReplace",
  },
  // "Sync discovery" → auto-scan translations
  "sync.*discovery|discovery|tərcüm.*sync|translation.*sync": {
    handler: "syncDiscovery",
  },
};

export function parseCommand(command) {
  const lower = command.toLowerCase();

  for (const [pattern, tpl] of Object.entries(TEMPLATES)) {
    if (new RegExp(pattern, "i").test(lower)) {
      return { matched: true, handler: tpl.handler, command };
    }
  }

  return { matched: false };
}

export async function executeRuleBased(command, projectContext) {
  const match = parseCommand(command);
  if (!match.matched) {
    return {
      plan: `Bu əmr üçün AI (GEMINI) lazımdır. Əmrin: "${command}"

Rule-based engine yalnız bu əmrləri tanıyır:
- "Yeni səhifə yarat" (məs: "Yeni haqqımızda səhifəsi yarat")
- "Sync discovery" (translation key-ləri scan et)

GEMINI_API_KEY əlavə et .env faylına:
GEMINI_API_KEY=your_key_here

Sonra bütün əmrlər işləyəcək.`,
      files: [],
      missingKeys: [],
      warnings: ["GEMINI_API_KEY tələb olunur"],
    };
  }

  if (match.handler === "syncDiscovery") {
    const { discoverAndSyncMissingKeys } = await import("@/lib/autoDiscovery");
    const result = await discoverAndSyncMissingKeys();
    return {
      plan: `Auto-Discovery tamamlandı!\n\n• Tapıldı: ${result.totalScanned} açar\n• Eksik: ${result.missing}\n• Yaradıldı: ${result.created}\n• Yeniləndi: ${result.updated}`,
      files: [],
      missingKeys: result.missingKeys || [],
      warnings: [],
    };
  }

  if (match.handler === "newPage") {
    // Extract page name from command
    const nameMatch = command.match(/(?:yeni|new|create)\s+(\w+)\s+səhifəsi?/i) ||
                      command.match(/(?:yeni|new|create)\s+(\w+)\s+page/i);
    const pageName = nameMatch ? nameMatch[1] : "yeni-sehife";
    const slug = pageName.toLowerCase().replace(/\s+/g, "-");

    return {
      plan: `"${pageName}" səhifəsi yaradılacaq:
1. src/app/[locale]/${slug}/page.js — yeni səhifə
2. AZ/EN/RU metadata
3. Admin link-i sidebar-a əlavə ediləcək`,
      files: [
        {
          path: `src/app/[locale]/${slug}/page.js`,
          action: "create",
          content: `export default function ${pageName.replace(/\s/g, "")}Page() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">${pageName}</h1>
      <p className="text-gray-600">Bu səhifə AI tərəfindən yaradılıb.</p>
    </div>
  );
}`,
          reason: `Yeni "${pageName}" səhifəsi`,
        },
      ],
      missingKeys: [
        { key: `nav.${slug}`, group: "nav", valueAz: pageName, label: slug },
      ],
      warnings: [],
    };
  }

  return {
    plan: `"${match.handler}" əmri tanındı amma hələ tam implement edilməyib. GEMINI_API_KEY ilə tam işləyəcək.`,
    files: [],
    missingKeys: [],
    warnings: ["Partial rule-based support"],
  };
}
