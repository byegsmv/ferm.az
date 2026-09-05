import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { clearGeminiKeyCache, geminiDebug } from "@/lib/gemini";

const DEFAULT_MODULES = [
  { id: "agronomist", name: "AI Aqronomist", description: "Bitki xəstəliklərini şəkil + mətn ilə analiz edir, məhsul tövsiyə edir", endpoint: "/api/ai/agronomist", page: "/agronom", icon: "sprout", isDefault: true },
  { id: "suggest-listing", name: "AI Elan Təklifi", description: "Məhsul şəkli/təsvirindən avtomatik elan başlığı və təsviri yaradır", endpoint: "/api/ai/suggest-listing", icon: "sparkles", isDefault: true },
  { id: "price-index", name: "AI Qiymət Proqnozu", description: "Bazar qiymətlərinin gələcək proqnozu", endpoint: "/api/ai/price-index", icon: "trendingUp", isDefault: true },
];

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const settings = await prisma.setting.findMany({ where: { category: "ai" } });
    const map = {};
    for (const s of settings) map[s.key] = s.value;

    const mask = (key) => {
      if (!map[key]) return "";
      const v = map[key];
      return v.length > 10 ? `${v.slice(0, 4)}...${v.slice(-4)}` : "••••";
    };

    const geminiKey = mask("geminiApiKey");
    const envKey = process.env.GEMINI_API_KEY || "";
    const maskedEnvKey = envKey.length > 10 ? `${envKey.slice(0, 4)}...${envKey.slice(-4)}` : "";

    // Build modules list
    let modules = DEFAULT_MODULES.map(m => ({
      ...m,
      active: map[`module.${m.id}.active`] !== "false",
    }));

    for (const s of settings) {
      if (s.key.startsWith("module.") && s.key.endsWith(".config")) {
        try {
          const config = JSON.parse(s.value);
          if (config.id && !modules.find(m => m.id === config.id)) {
            modules.push({
              ...config,
              active: map[`module.${config.id}.active`] !== "false",
              isCustom: true,
            });
          }
        } catch (e) {}
      }
    }

    return Response.json({
      geminiKey,
      geminiKeySource: map["geminiApiKey"] ? "database" : (envKey ? "env" : "none"),
      geminiEnvKey: maskedEnvKey,
      hasActiveKey: !!(map["geminiApiKey"] || envKey),
      model: "gemini-2.5-flash",
      aiDebug: { provider: geminiDebug.lastProvider, lastError: geminiDebug.lastError, lastStatus: geminiDebug.lastStatus, modelCatalog: geminiDebug.modelCatalog },

      // Other API keys
      resendKey: mask("resendApiKey"),
      resendKeySource: map["resendApiKey"] ? "database" : "none",
      sentryDsn: mask("sentryDsn"),
      sentryDsnSource: map["sentryDsn"] ? "database" : "none",
      alphaVantageKey: mask("alphaVantageKey"),
      alphaVantageKeySource: map["alphaVantageKey"] ? "database" : "none",
      groqKey: mask("groqApiKey"),
      groqKeySource: map["groqApiKey"] ? "database" : "none",
      huggingfaceKey: mask("huggingfaceApiKey"),
      huggingfaceKeySource: map["huggingfaceApiKey"] ? "database" : "none",
      togetherKey: mask("togetherApiKey"),
      togetherKeySource: map["togetherApiKey"] ? "database" : "none",

      modules,
    });
  } catch (error) {
    return Response.json({ error: "Ayarlar yüklənmədi: " + error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await request.json();

    // API Key mappings: frontend key -> DB key
    const keyMappings = {
      geminiApiKey: "geminiApiKey",
      resendApiKey: "resendApiKey",
      sentryDsn: "sentryDsn",
      alphaVantageKey: "alphaVantageKey",
      groqApiKey: "groqApiKey",
      huggingfaceApiKey: "huggingfaceApiKey",
      togetherApiKey: "togetherApiKey",
    };

    // 1. Update any API key
    for (const [frontendKey, dbKey] of Object.entries(keyMappings)) {
      if (body[frontendKey] !== undefined) {
        const value = body[frontendKey].trim();
        if (!value) {
          await prisma.setting.deleteMany({ where: { key: dbKey, category: "ai" } });
          clearGeminiKeyCache();
          return Response.json({ success: true, message: `${dbKey} silindi` });
        }
        await prisma.setting.upsert({
          where: { key: dbKey },
          update: { value, category: "ai" },
          create: { key: dbKey, value, category: "ai" },
        });
        clearGeminiKeyCache();
        return Response.json({ success: true, message: `${dbKey} yeniləndi` });
      }
    }

    // 2. Toggle module active/deactive
    if (body.moduleId && body.moduleActive !== undefined) {
      const key = `module.${body.moduleId}.active`;
      await prisma.setting.upsert({
        where: { key },
        update: { value: body.moduleActive ? "true" : "false", category: "ai" },
        create: { key, value: body.moduleActive ? "true" : "false", category: "ai" },
      });
      return Response.json({ success: true, message: `Modul ${body.moduleActive ? "aktivləşdirildi" : "deaktivləşdirildi"}` });
    }

    // 3. Add new custom module
    if (body.newModule) {
      if (!body.newModule.id || !body.newModule.name) return Response.json({ error: "Modul ID və adı tələb olunur" }, { status: 400 });
      const configKey = `module.${body.newModule.id}.config`;
      const existing = await prisma.setting.findUnique({ where: { key: configKey } });
      if (existing) return Response.json({ error: "Bu ID ilə modul artıq mövcuddur" }, { status: 400 });

      await prisma.setting.create({
        data: {
          key: configKey,
          value: JSON.stringify({
            id: body.newModule.id,
            name: body.newModule.name,
            description: body.newModule.description || "",
            endpoint: body.newModule.endpoint || "",
            icon: body.newModule.icon || "bot",
          }),
          category: "ai",
        },
      });
      await prisma.setting.create({
        data: { key: `module.${body.newModule.id}.active`, value: "true", category: "ai" },
      }).catch(() => {});
      return Response.json({ success: true, message: "Yeni AI modulu əlavə edildi" });
    }

    // 4. Delete custom module
    if (body.deleteModuleId) {
      await prisma.setting.deleteMany({
        where: { OR: [
          { key: `module.${body.deleteModuleId}.config` },
          { key: `module.${body.deleteModuleId}.active` },
        ] },
      });
      return Response.json({ success: true, message: "Modul silindi" });
    }

    return Response.json({ error: "Heç bir əməliyyat təyin edilmədi" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: "Yeniləmə uğursuz: " + error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    let apiKey = "";
    const dbSetting = await prisma.setting.findUnique({ where: { key: "geminiApiKey" } });
    if (dbSetting) apiKey = dbSetting.value;
    else apiKey = process.env.GEMINI_API_KEY || "";

    if (!apiKey) return Response.json({ success: false, message: "Heç bir API açarı təyin edilməyib. Əvvəlcə açar əlavə edin." });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Salam. Qısa cavab ver." }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 50, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );
    const data = await res.json();
    if (res.ok && data?.candidates?.[0]) {
      const responseText = data.candidates[0].content?.parts?.map(p => p.text).join("") || "";
      return Response.json({ success: true, message: "API açarı işləyir! Gemini cavab verdi.", sample: responseText.slice(0, 100) });
    } else {
      return Response.json({ success: false, message: `API xətası: ${data?.error?.message || "Bilinməyən xəta"}` });
    }
  } catch (error) {
    return Response.json({ success: false, message: `Bağlantı xətası: ${error.message}` });
  }
}
