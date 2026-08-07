import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { clearGeminiKeyCache } from "@/lib/gemini";

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

    const geminiKey = map["geminiApiKey"] || "";
    const maskedKey = geminiKey ? geminiKey.slice(0, 6) + "••••••••••••••••" + geminiKey.slice(-4) : "";
    const envKey = process.env.GEMINI_API_KEY || "";
    const maskedEnvKey = envKey ? envKey.slice(0, 6) + "••••••••••••••••" + envKey.slice(-4) : "";

    // Build modules list: start with defaults, overlay any custom modules from DB
    let modules = DEFAULT_MODULES.map(m => ({
      ...m,
      active: map[`module.${m.id}.active`] !== "false", // default active
    }));

    // Add custom modules from DB
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
      geminiKey: maskedKey,
      geminiKeySource: geminiKey ? "database" : (envKey ? "env" : "none"),
      geminiEnvKey: maskedEnvKey,
      hasActiveKey: !!(geminiKey || envKey),
      model: "gemini-2.5-flash",
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
    const { geminiApiKey, moduleId, moduleActive, newModule, deleteModuleId } = body;

    // 1. Update API key
    if (geminiApiKey !== undefined) {
      if (!geminiApiKey.trim()) {
        await prisma.setting.deleteMany({ where: { key: "geminiApiKey", category: "ai" } });
        clearGeminiKeyCache();
        return Response.json({ success: true, message: "API açarı silindi — sistem env/offline rejimə keçəcək" });
      }
      const trimmed = geminiApiKey.trim();
      if (trimmed.length < 20) return Response.json({ error: "API açarı çox qısadır" }, { status: 400 });
      await prisma.setting.upsert({
        where: { key: "geminiApiKey" },
        update: { value: trimmed, category: "ai" },
        create: { key: "geminiApiKey", value: trimmed, category: "ai" },
      });
      clearGeminiKeyCache();
      return Response.json({ success: true, message: "Gemini API açarı uğurla yeniləndi" });
    }

    // 2. Toggle module active/deactive
    if (moduleId && moduleActive !== undefined) {
      const key = `module.${moduleId}.active`;
      await prisma.setting.upsert({
        where: { key },
        update: { value: moduleActive ? "true" : "false", category: "ai" },
        create: { key, value: moduleActive ? "true" : "false", category: "ai" },
      });
      return Response.json({ success: true, message: `Modul ${moduleActive ? "aktivləşdirildi" : "deaktivləşdirildi"}` });
    }

    // 3. Add new custom module
    if (newModule) {
      if (!newModule.id || !newModule.name) return Response.json({ error: "Modul ID və adı tələb olunur" }, { status: 400 });
      const configKey = `module.${newModule.id}.config`;
      const existing = await prisma.setting.findUnique({ where: { key: configKey } });
      if (existing) return Response.json({ error: "Bu ID ilə modul artıq mövcuddur" }, { status: 400 });

      await prisma.setting.create({
        data: {
          key: configKey,
          value: JSON.stringify({
            id: newModule.id,
            name: newModule.name,
            description: newModule.description || "",
            endpoint: newModule.endpoint || "",
            icon: newModule.icon || "bot",
          }),
          category: "ai",
        },
      });
      // Set as active by default
      await prisma.setting.create({
        data: { key: `module.${newModule.id}.active`, value: "true", category: "ai" },
      }).catch(() => {});
      return Response.json({ success: true, message: "Yeni AI modulu əlavə edildi" });
    }

    // 4. Delete custom module
    if (deleteModuleId) {
      await prisma.setting.deleteMany({
        where: { OR: [
          { key: `module.${deleteModuleId}.config` },
          { key: `module.${deleteModuleId}.active` },
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
