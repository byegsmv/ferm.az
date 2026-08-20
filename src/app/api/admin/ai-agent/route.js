import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { geminiGenerate } from "@/lib/gemini";
import { SafeExecutor } from "@/lib/safeExecutor";
import { discoverAndSyncMissingKeys } from "@/lib/autoDiscovery";

const executor = new SafeExecutor();

// AI Full-Stack Agent — natural dil ilə idarə olunan code generator
export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { command, context, mode = "plan" } = body;

  if (!command) {
    return Response.json({ error: "Əmr (command) tələb olunur" }, { status: 400 });
  }

  // mode: "plan" | "dry-run" | "apply"
  // plan — AI analiz edib plan qaytarır, heç nəyi dəyişmir
  // dry-run — AI code generatе edir amma yazmır, diff göstərir
  // apply — AI generated code-u fayllara yazır

  try {
    // 1. Build context: project structure, existing routes, components, DB schema
    const projectContext = await buildProjectContext();

    // 2. AI prompt — system instruction
    const systemPrompt = buildSystemPrompt(projectContext, mode);

    // 3. Call Gemini
    const aiText = await geminiGenerate({ prompt: `${systemPrompt}\n\nUSER COMMAND: ${command}\n\nMODE: ${mode}` });

    // 4. Parse AI response
    const parsed = parseAIResponse(aiText);

    // 5. Validate (for dry-run and apply modes)
    if (mode === "dry-run" || mode === "apply") {
      const validation = validateChanges(parsed);
      if (!validation.valid) {
        return Response.json({ error: "AI generated code validation failed", errors: validation.errors }, { status: 422 });
      }
    }

    // 6. Execute (for apply mode only)
    if (mode === "apply") {
      // Validate with SafeExecutor
      const validation = executor.validate(parsed);
      if (!validation.valid) {
        return Response.json({ error: "Validation failed", errors: validation.errors, warnings: validation.warnings }, { status: 422 });
      }

      // Dry-run first
      const diffs = await executor.dryRun(parsed);

      // Apply
      const result = await executor.apply(parsed);

      if (!result.success) {
        // Rollback
        await executor.rollback();
        return Response.json({ error: "Apply failed, rolled back", results: result.results }, { status: 500 });
      }

      parsed.applyResults = result.results;
    }

    return Response.json({
      mode,
      plan: parsed.plan || null,
      files: parsed.files || null,
      missingKeys: parsed.missingKeys || null,
      warnings: parsed.warnings || [],
    });

  } catch (error) {
    console.error("AI Agent error:", error);
    return Response.json({ error: `AI Agent xətası: ${error.message}` }, { status: 500 });
  }
}

async function buildProjectContext() {
  // Get existing API routes
  const fs = await import("fs");
  const path = await import("path");

  const apiRoutes = [];
  const components = [];

  function scanDir(dir, targetArr, ext) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        scanDir(full, targetArr, ext);
      } else if (entry.name.endsWith(ext)) {
        const rel = path.relative(process.cwd(), full);
        targetArr.push(rel);
      }
    }
  }

  scanDir("src/app/api", apiRoutes, ".js");
  scanDir("src/components", components, ".js");

  // Get DB schema summary
  const schemaFile = fs.readFileSync("prisma/schema.prisma", "utf-8");
  const models = schemaFile.match(/model\s+(\w+)/g)?.map(m => m.replace("model ", "")) || [];

  // Get existing site texts
  const siteTexts = await prisma.siteText.findMany({
    select: { key: true, valueAz: true, group: true },
  });

  return {
    apiRoutes,
    components,
    dbModels: models,
    siteTexts,
    totalApiRoutes: apiRoutes.length,
    totalComponents: components.length,
  };
}

function buildSystemPrompt(ctx, mode) {
  return `Sen FermerMarket.az admin panel-inin AI Full-Stack Agent-isən. Sən natural dil ilə verilən əmrləri başa düşüb, düzgün code generatе edirsən.

PROJECT CONTEXT:
- Next.js 16 (App Router) + React 18
- Prisma ORM + PostgreSQL
- TailwindCSS + shadcn/ui
- next-intl ilə i18n (AZ/EN/RU)
- API routes: src/app/api/ (${ctx.totalApiRoutes} route)
- Components: src/components/ (${ctx.totalComponents} component)
- DB Models: ${ctx.dbModels.join(", ")}
- Site Texts: ${ctx.siteTexts.length} key mövcuddur

RULES:
1. Heç vaxt mövcud kodu pozma — yeni kod əlavə et və ya düzgün refactor et
2. Hər yeni səhifə üçün [locale]/ altında yarat
3. Hər yeni API route üçün düzgün auth check əlavə et
4. Hər yeni component üçün düzgün import-ları yaz
5. Database dəyişiklikləri üçün Prisma schema update + migration qeyd et
6. Translation key-ləri avtomatik yarat (t("group.key", "fallback AZ"))
7. Hər fayl üçün TAM kodu yaz, yarımçıq yazma
8. Validation, error handling, loading state hamısını yaz

RESPONSE FORMAT (JSON):
{
  "plan": "Nə edəcəyinin addım-addım izahı (plan mode üçün)",
  "files": [
    {
      "path": "src/app/[locale]/yeni-sehife/page.js",
      "action": "create|update|delete",
      "content": "faylın tam kodu (create/update üçün)",
      "reason": "nə üçün bu fayl dəyişdirilir"
    }
  ],
  "missingKeys": [
    {"key": "new.page.title", "group": "new", "valueAz": "Yeni Səhifə", "label": "page.title"}
  ],
  "warnings": ["Ehtiyatlı olmalı yerlər"]
}

MODE: ${mode}
- plan: Sadəcə plan izah et, code yazma
- dry-run: Kodu generatе et amma fayla yazma, diff göstər
- apply: Kodu generatе et və fayllara yaz

Cavabını JSON formatında ver. Başqa heç nə yazma.`;
}

function parseAIResponse(text) {
  // AI bəzən markdown code block içində JSON yazır
  let jsonStr = text;

  // ```json ... ``` blokunu çıxar
  const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  // {...} blokunu tap
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    return {
      plan: text,
      files: [],
      missingKeys: [],
      warnings: ["AI cavabı JSON formatında deyil"],
    };
  }
}

function validateChanges(parsed) {
  const errors = [];

  if (!parsed.files || !Array.isArray(parsed.files)) {
    errors.push("AI response-da 'files' array tapılmadı");
    return { valid: false, errors };
  }

  for (const file of parsed.files) {
    if (!file.path) errors.push("Fayl path-i yoxdur");
    if (!file.action) errors.push(`${file.path}: action yoxdur`);
    if ((file.action === "create" || file.action === "update") && !file.content) {
      errors.push(`${file.path}: content yoxdur`);
    }
    if (!["create", "update", "delete"].includes(file.action)) {
      errors.push(`${file.path}: yanlış action — "${file.action}"`);
    }
    // Security: path traversal check
    if (file.path.includes("..") || file.path.startsWith("/")) {
      errors.push(`${file.path}: path traversal aşkarlandı`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// POST /api/admin/ai-agent?action=sync-discovery — auto-discover missing translation keys
export async function POST_SYNC(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  const result = await discoverAndSyncMissingKeys();
  return Response.json(result);
}
