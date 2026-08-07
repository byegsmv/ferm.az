import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";

// GET /api/admin/ai-settings — returns AI module statuses + key info (masked)
export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const settings = await prisma.setting.findMany({ where: { category: "ai" } });
    const map = {};
    for (const s of settings) map[s.key] = s.value;

    const geminiKey = map["geminiApiKey"] || "";
    const maskedKey = geminiKey
      ? geminiKey.slice(0, 6) + "••••••••••••••••" + geminiKey.slice(-4) : "";

    const envKey = process.env.GEMINI_API_KEY || "";
    const maskedEnvKey = envKey
      ? envKey.slice(0, 6) + "••••••••••••••••" + envKey.slice(-4) : "";

    return Response.json({
      geminiKey: maskedKey,
      geminiKeySource: geminiKey ? "database" : (envKey ? "env" : "none"),
      geminiEnvKey: maskedEnvKey,
      hasActiveKey: !!(geminiKey || envKey),
      model: "gemini-2.5-flash",
      modules: [
        { id: "agronomist", name: "AI Aqronomist", description: "Bitki xəstəliklərini şəkil + mətn ilə analiz edir, məhsul tövsiyə edir", endpoint: "/api/ai/agronomist", page: "/agronom", status: "active", icon: "sprout" },
        { id: "suggest-listing", name: "AI Elan Təklifi", description: "Məhsul şəkli/təsvirindən avtomatik elan başlığı və təsviri yaradır", endpoint: "/api/ai/suggest-listing", status: geminiKey || envKey ? "ready" : "placeholder", icon: "sparkles" },
        { id: "price-index", name: "AI Qiymət Proqnozu", description: "Bazar qiymətlərinin gələcək proqnozu (Gemini tələb edir)", status: geminiKey || envKey ? "ready" : "offline", icon: "trendingUp" },
      ],
    });
  } catch (error) {
    return Response.json({ error: "Ayarlar yüklənmədi: " + error.message }, { status: 500 });
  }
}

// PUT — update Gemini API key
export async function PUT(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ["ADMIN", "SUPER_ADMIN"]);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { geminiApiKey } = body;
    if (geminiApiKey === undefined) return Response.json({ error: "geminiApiKey tələb olunur" }, { status: 400 });

    if (!geminiApiKey.trim()) {
      await prisma.setting.deleteMany({ where: { key: "geminiApiKey", category: "ai" } });
      return Response.json({ success: true, message: "API açarı silindi — sistem env/offline rejimə keçəcək" });
    }

    const trimmed = geminiApiKey.trim();
    if (trimmed.length < 20) return Response.json({ error: "API açarı çox qısadır — düzgün Gemini API açarı olduğunu yoxlayın" }, { status: 400 });

    await prisma.setting.upsert({
      where: { key: "geminiApiKey" },
      update: { value: trimmed, category: "ai" },
      create: { key: "geminiApiKey", value: trimmed, category: "ai" },
    });

    return Response.json({ success: true, message: "Gemini API açarı uğurla yeniləndi" });
  } catch (error) {
    return Response.json({ error: "Yeniləmə uğursuz: " + error.message }, { status: 500 });
  }
}

// POST — test the Gemini API key
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
          contents: [{ parts: [{ text: "Salam" }] }],
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
