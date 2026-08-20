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
  // "Mətn dəyişdir" / "linki dəyişdir" → text/link replacement
  "mətn.*dəyiş|text.*change|replace.*text|link.*dəyiş|link.*change|change.*link|facebook.*link|instagram.*link|whatsapp.*link": {
    handler: "linkReplace",
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

  if (match.handler === "linkReplace") {
    const fs = await import("fs");
    const path = await import("path");

    // Extract old/new links from command
    // "facebook linkini https://new-url ile evez et"
    const urlMatch = command.match(/https?:\/\/[^\s"']+/);
    const newUrl = urlMatch ? urlMatch[0] : null;

    // Detect platform from command
    const platform = command.toLowerCase().includes("facebook") ? "facebook"
      : command.toLowerCase().includes("instagram") ? "instagram"
      : command.toLowerCase().includes("whatsapp") ? "whatsapp"
      : null;

    if (!platform) {
      return {
        plan: "Hansı platformun linkini dəyişmək istəyirsən? (facebook, instagram, whatsapp)",
        files: [],
        missingKeys: [],
        warnings: ["Platform aşkar edilmədi"],
      };
    }

    if (!newUrl) {
      return {
        plan: `Yeni ${platform} linkini əmrinə daxil et.\nMəsələn: "${platform} linkini https://facebook.com/yenisehife ile evez et"`,
        files: [],
        missingKeys: [],
        warnings: ["Yeni URL tapılmadı"],
      };
    }

    // Find files containing the platform link
    const footerFiles = ["src/components/Footer.js", "src/components/home/Footer.js"];
    const changes = [];

    for (const file of footerFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, "utf-8");
      let modified = false;
      let newContent = content;

      // Replace platform-specific URLs
      if (platform === "facebook") {
        // Match facebook URL patterns
        const fbRegex = /https?:\/\/(?:www\.)?(?:facebook\.com|fb\.com)\/[^\s"')>]*/gi;
        const matches = content.match(fbRegex);
        if (matches) {
          for (const oldUrl of matches) {
            newContent = newContent.replace(oldUrl, newUrl);
            modified = true;
          }
        }
        // Also check st("footer.facebookUrl", "...") pattern
        const fbDefaultRegex = /("(?:footer\.facebookUrl)".*?,\s*")([^"]*)(")/;
        const fbMatch = content.match(fbDefaultRegex);
        if (fbMatch) {
          newContent = newContent.replace(fbDefaultRegex, `$1${newUrl}$3`);
          modified = true;
        }
      } else if (platform === "instagram") {
        const igRegex = /https?:\/\/(?:www\.)?instagram\.com\/[^\s"')>]*/gi;
        const matches = content.match(igRegex);
        if (matches) {
          for (const oldUrl of matches) {
            newContent = newContent.replace(oldUrl, newUrl);
            modified = true;
          }
        }
      } else if (platform === "whatsapp") {
        const waRegex = /https?:\/\/(?:wa\.me|api\.whatsapp\.com)[^\s"')>]*/gi;
        const matches = content.match(waRegex);
        if (matches) {
          for (const oldUrl of matches) {
            newContent = newContent.replace(oldUrl, newUrl);
            modified = true;
          }
        }
      }

      if (modified) {
        changes.push({
          path: file,
          action: "update",
          content: newContent,
          reason: `${platform} linki dəyişdirildi: ${newUrl}`,
        });
      }
    }

    if (changes.length === 0) {
      return {
        plan: `${platform} linki tapılmadı. Yoxla:\n- Footer.js\n- home/Footer.js\n\nƏmri dəqiqləşdir.`,
        files: [],
        missingKeys: [],
        warnings: [`${platform} URL-i mövcud fayllarda tapılmadı`],
      };
    }

    return {
      plan: `${platform} linki dəyişdiriləcək:\n\n${changes.map(c => `📝 \`${c.path}\`\n   → ${newUrl}`).join('\n\n')}`,
      files: changes,
      missingKeys: [],
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
