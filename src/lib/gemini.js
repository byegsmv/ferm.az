// Thin wrapper around Google's Gemini REST API. Server-side only.
// Reads API key from: 1) DB Setting table (admin-managed), 2) env var, 3) offline fallback.
const MODEL = "gemini-2.5-flash";

let cachedKey = null;
let cacheExpiry = 0;

async function getApiKey() {
  // Check cache (valid for 60 seconds)
  if (cachedKey !== null && Date.now() < cacheExpiry) return cachedKey;

  try {
    // Dynamic import to avoid circular dependencies
    const { prisma } = await import("@/lib/prisma");
    const setting = await prisma.setting.findUnique({ where: { key: "geminiApiKey" } });
    if (setting && setting.value) {
      cachedKey = setting.value;
      cacheExpiry = Date.now() + 60000;
      return cachedKey;
    }
  } catch (e) {
    // DB not available, fall through to env
  }

  // Fall back to env var
  cachedKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  cacheExpiry = Date.now() + 60000;
  return cachedKey;
}

// Clear cache when admin updates the key (called from the API route)
export function clearGeminiKeyCache() {
  cachedKey = null;
  cacheExpiry = 0;
}

function offlineGenerate(prompt) {
  const promptLower = prompt.toLowerCase();

  if (promptLower.includes("json formatında") || promptLower.includes("diagnosis")) {
    if (promptLower.includes("mənənə") || promptLower.includes("aphid")) {
      return JSON.stringify({
        diagnosis: "Mənənə (Aphids)",
        confidencePercent: 95,
        causes: ["Sahədə rütubətin yüksək olması", "Faydalı cırcırama və parabüzənlərin azlığı"],
        treatment: ["İnsektisidlərlə çiləmə aparmaq (məs. İmidakloprid tərkibli)", "Yarpaqları sabunlu məhlulla yumaq"],
        recommendedProducts: ["İmidakloprid 200", "Karate Zeon"],
        needsExpertConsult: false,
        summary: "Hörmətli fermer, sahənizdə mənənə zərərvericisi aşkarlanıb. İmidakloprid tərkibli preparatlarla vaxtında mübarizə aparmağınız tövsiyə olunur."
      });
    }
    if (promptLower.includes("kolorado") || promptLower.includes("beetle") || promptLower.includes("kartof")) {
      return JSON.stringify({
        diagnosis: "Kolorado Kartof Böcəyi",
        confidencePercent: 98,
        causes: ["Növbəli əkin qaydalarına əməl edilməməsi", "İsti və quru hava şəraiti"],
        treatment: ["Böcəklərin və yumurtalarının mexaniki yığılması", "Sürfələrə qarşı xüsusi insektisidlərin tətbiqi"],
        recommendedProducts: ["Mospilan", "Decis Profi"],
        needsExpertConsult: false,
        summary: "Hörmətli fermer, sahənizdə Kolorado böcəyi yayılmışdır. Sürətli inkişafın qarşısını almaq üçün dərhal insektisid çiləməsi tövsiyə olunur."
      });
    }
    return JSON.stringify({
      diagnosis: "Bitki stressi və ya qida çatışmazlığı",
      confidencePercent: 80,
      causes: ["Düzgün olmayan suvarma rejimi", "Torpaqda azot (N) və ya kalium (K) çatışmazlığı"],
      treatment: ["Suvarma rejiminin optimallaşdırılması", "Yarpaqdan kompleks mineral gübrələrin (NPK) verilməsi"],
      recommendedProducts: ["NPK 20-20-20", "Humik Turşu preparatları"],
      needsExpertConsult: true,
      summary: "Hörmətli fermer, bitkidə qida çatışmazlığı əlamətləri görünür. Kompleks mikroelementli mineral gübrələrin tətbiqi faydalı olar."
    });
  }

  if (promptLower.includes("təsvir") || promptLower.includes("description") || promptLower.includes("yaz")) {
    return "Bu məhsul kənd təsərrüfatı standartlarına tam uyğun olaraq yüksək məhsuldarlıq və bitki mühafizəsini təmin etmək üçün istehsal olunmuşdur. Həm ekoloji təmizliyi qoruyur, həm də sahənizi zərərvericilərdən səmərəli şəkildə müdafiə edir.";
  }

  if (promptLower.includes("qiymət") || promptLower.includes("price") || promptLower.includes("forecasting")) {
    return JSON.stringify([
      { month: "Yanvar", price: 1.20 }, { month: "Fevral", price: 1.40 },
      { month: "Mart", price: 1.50 }, { month: "Aprel", price: 1.10 },
      { month: "May", price: 0.90 }, { month: "İyun", price: 0.70 }
    ]);
  }

  return "Lokal simulyasiya cavabı: Kənd təsərrüfatı layihəsi uğurla işləyir.";
}

export async function geminiGenerate({ prompt, imageBase64, imageMimeType, maxOutputTokens = 2048 }) {
  const key = await getApiKey();

  if (!key) {
    console.log("⚠️ AI bağlantı açarı tapılmadı. Offline simulyasiya rejimində işləyir.");
    return offlineGenerate(prompt);
  }

  try {
    const parts = [{ text: prompt }];
    if (imageBase64) {
      parts.push({ inline_data: { mime_type: imageMimeType || "image/jpeg", data: imageBase64 } });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.6, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "AI sorğusu uğursuz oldu");

    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text).join("\n") || "";
    if (candidate?.finishReason === "MAX_TOKENS" && !text) throw new Error("AI cavabı çox uzun oldu, yenidən cəhd edin");
    return text.trim();
  } catch (err) {
    console.log("⚠️ AI xətası, offline rejimə keçilir:", err.message);
    return offlineGenerate(prompt);
  }
}

// Check if an AI module is active (DB setting)
export async function isModuleActive(moduleId) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const setting = await prisma.setting.findUnique({
      where: { key: `module.${moduleId}.active` },
    });
    // Default active if no setting exists
    return !setting || setting.value !== "false";
  } catch (e) {
    return true; // Default active on error
  }
}
