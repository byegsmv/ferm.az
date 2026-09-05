// AI provider wrapper with fallback chain: Google Gemini → Groq → xAI (Grok) → offline simulation.
// Server-side only. Keys are read from: 1) DB Setting table (admin-managed), 2) env vars.
// Keys are routed to providers by prefix: AIza* → Gemini, gsk_* → Groq, xai-* → xAI Grok.
// Any other format is attempted against the Gemini endpoint (legacy behavior).
const MODEL = "gemini-2.5-flash";

// Vision-capable chat models for OpenAI-compatible providers (tried in order).
const GROQ_MODELS = ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"];
const XAI_MODELS = ["grok-2-vision-1212", "grok-vision-beta"];

// Temporary diagnostics: last AI provider used / last error (null when last call succeeded)
export const geminiDebug = { lastError: null, lastStatus: null, lastProvider: null, modelCatalog: null };

let keyCache = null; // { gemini, groq, xai }
let cacheExpiry = 0;

const DB_KEY_FIELDS = ["geminiApiKey", "groqApiKey", "huggingfaceApiKey", "togetherApiKey"];

function classifyKey(keys, value) {
  if (!value) return;
  if (/^AIza/.test(value)) keys.gemini = keys.gemini || value;
  else if (/^gsk_/.test(value)) keys.groq = keys.groq || value;
  else if (/^xai-/.test(value)) keys.xai = keys.xai || value;
  else keys.gemini = keys.gemini || value; // unknown format: try Gemini endpoint (legacy)
}

async function loadKeys() {
  // Check cache (valid for 60 seconds)
  if (keyCache !== null && Date.now() < cacheExpiry) return keyCache;

  const keys = { gemini: "", groq: "", xai: "" };
  try {
    // Dynamic import to avoid circular dependencies
    const { prisma } = await import("@/lib/prisma");
    const settings = await prisma.setting.findMany({
      where: { key: { in: DB_KEY_FIELDS }, category: "ai" },
    });
    const dbMap = {};
    for (const s of settings) dbMap[s.key] = s.value;
    classifyKey(keys, dbMap.geminiApiKey);
    classifyKey(keys, dbMap.groqApiKey);
    classifyKey(keys, dbMap.huggingfaceApiKey);
    classifyKey(keys, dbMap.togetherApiKey);
  } catch (e) {
    // DB not available, fall through to env
  }

  classifyKey(keys, process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "");
  classifyKey(keys, process.env.GROQ_API_KEY || process.env.XAI_API_KEY || "");

  keyCache = keys;
  cacheExpiry = Date.now() + 60000;
  return keys;
}

// Clear cache when admin updates any AI key (called from the API route)
export function clearGeminiKeyCache() {
  keyCache = null;
  cacheExpiry = 0;
  metaCache.at = 0;
  metaCache.models = {};
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
        summary: "Hörmətli fermer, sahənizdə mənənə zərəvericisi aşkarlanıb. İmidakloprid tərkibli preparatlarla vaxtında mübarizə aparmağınız tövsiyə olunur."
      });
    }
    if (promptLower.includes("kolorado") || promptLower.includes("beetle") || promptLower.includes("kartof")) {
      return JSON.stringify({
        diagnosis: "Kolorado Kartof Böcəyi",
        confidencePercent: 98,
        causes: ["Növbəli əkin qaydalarına əməl edilməməsi", "İsti və quru hava şəraiti"],
        treatment: ["Böcəklərin və yumurtalarının mexaniki yığılması", "Sürfälərə qarşı xüsusi insektisidlərin tətbiqi"],
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

// Google Gemini (native REST API)
async function callGemini({ key, prompt, imageBase64, imageMimeType, maxOutputTokens, jsonMode }) {
  const parts = [{ text: prompt }];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: imageMimeType || "image/jpeg", data: imageBase64 } });
  }

  const generationConfig = { temperature: 0.6, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } };
  // Force the model to emit strictly valid JSON (no markdown fences, no raw
  // control chars inside strings) — otherwise multi-paragraph text fields
  // (e.g. descriptions) often contain literal newlines that break JSON.parse.
  if (jsonMode) generationConfig.responseMimeType = "application/json";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig,
      }),
    }
  );

  const data = await res.json().catch(() => ({}));
  geminiDebug.lastStatus = res.status;
  if (!res.ok) {
    throw new Error((data?.error?.message || "AI sorğusu uğursuz oldu") + ` [HTTP ${res.status}]`);
  }

  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text).join("\n") || "";
  if (candidate?.finishReason === "MAX_TOKENS" && !text) throw new Error("AI cavabı çox uzun oldu, yenidən cəhd edin");
  return text.trim();
}

// Discover available models on an OpenAI-compatible provider (cached 10 min).
const metaCache = { at: 0, models: {} };
async function discoverModels(endpoint, key) {
  const metaKey = endpoint;
  if (metaCache.models[metaKey] && Date.now() - metaCache.at < 10 * 60 * 1000) return metaCache.models[metaKey];
  try {
    const res = await fetch(endpoint.replace("/chat/completions", "/models"), {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const ids = (data?.data || []).map((m) => m.id).filter(Boolean);
      if (ids.length) {
        metaCache.models[metaKey] = ids;
        metaCache.at = Date.now();
        geminiDebug.modelCatalog = { ...(geminiDebug.modelCatalog || {}), [metaKey.split("//")[1].split("/")[0]]: ids };
        return ids;
      }
    }
  } catch (e) {}
  return [];
}

function pickModels(available, prefs, fallback) {
  const picked = [];
  for (const re of prefs) {
    for (const id of available) if (re.test(id) && !picked.includes(id)) picked.push(id);
  }
  return picked.length ? picked : fallback;
}

// OpenAI-compatible chat completions (Groq / xAI)
async function callOpenAICompat({ endpoint, key, models, prompt, imageBase64, imageMimeType, maxOutputTokens, jsonMode, includeImage = true }) {
  const content = [{ type: "text", text: prompt }];
  if (imageBase64 && includeImage) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}` },
    });
  }

  let lastErr = null;
  for (const model of models) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content }],
          temperature: 0.6,
          max_completion_tokens: maxOutputTokens,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      geminiDebug.lastStatus = res.status;
      if (!res.ok) {
        lastErr = new Error((data?.error?.message || "AI sorğusu uğursuz oldu") + ` [${model} HTTP ${res.status}]`);
        // Bad/expired key — no point trying other models
        if (res.status === 401 || res.status === 403) throw lastErr;
        continue;
      }

      const text = (data?.choices?.[0]?.message?.content || "").trim();
      if (text) return text;
      lastErr = new Error(`Boş cavab [${model}]`);
    } catch (e) {
      lastErr = e;
      if (e.message?.includes("HTTP 401") || e.message?.includes("HTTP 403")) throw e;
    }
  }
  throw lastErr || new Error("AI cavabı alınmadı");
}

export async function geminiGenerate({ prompt, imageBase64, imageMimeType, maxOutputTokens = 2048, jsonMode = false }) {
  const keys = await loadKeys();
  const errors = [];

  // 1) Google Gemini
  if (keys.gemini) {
    try {
      const text = await callGemini({ key: keys.gemini, prompt, imageBase64, imageMimeType, maxOutputTokens, jsonMode });
      geminiDebug.lastProvider = `gemini:${MODEL}`;
      geminiDebug.lastError = null;
      return text;
    } catch (err) {
      errors.push(`Gemini: ${err.message}`);
      geminiDebug.lastError = errors.join(" | ");
      console.log("⚠️ Gemini xətası:", err.message);
    }
  }

  // 2) Groq (OpenAI-compatible)
  if (keys.groq) {
    try {
      const available = await discoverModels("https://api.groq.com/openai/v1/chat/completions", keys.groq);
      const visionRe = /vision|llama-4|scout|maverick|pixtral|qwen.*vl|gpt-4o|gemma|llama-3\.2/i;
      const visionModels = available.filter((id) => visionRe.test(id));
      const textModels = pickModels(available, [/qwen3\.\d+-27b/i, /gpt-oss-120b/i, /gpt-oss-20b/i, /qwen/i, /allam-2/i, /compound-mini/i], GROQ_MODELS);
      const hasImage = !!imageBase64;
      const useVision = hasImage && visionModels.length > 0;
      const groqModels = (hasImage ? (useVision ? visionModels : textModels) : textModels).slice(0, 4);
      if (hasImage && !useVision) {
        // Hesabda vision model yoxdur — shekli at, metnle davam et
        console.log("⚠️ Groq: vision model tapılmadı, şəklsiz (yalnız mətn) analiz davam edir");
      }
      const text = await callOpenAICompat({
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        key: keys.groq,
        models: groqModels,
        prompt, imageBase64, imageMimeType, maxOutputTokens, jsonMode,
        includeImage: useVision,
      });
      geminiDebug.lastProvider = "groq";
      geminiDebug.lastError = null;
      return text;
    } catch (err) {
      errors.push(`Groq: ${err.message}`);
      geminiDebug.lastError = errors.join(" | ");
      console.log("⚠️ Groq xətası:", err.message);
    }
  }

  // 3) xAI Grok (OpenAI-compatible)
  if (keys.xai) {
    try {
      const availableX = await discoverModels("https://api.x.ai/v1/chat/completions", keys.xai);
      const visionReX = /vision|grok-4|grok-3/i;
      const visionModelsX = availableX.filter((id) => visionReX.test(id));
      const textModelsX = pickModels(availableX, [/grok-4/i, /grok-3/i, /grok-2/i], XAI_MODELS);
      const hasImageX = !!imageBase64;
      const useVisionX = hasImageX && visionModelsX.length > 0;
      const xaiModels = (hasImageX ? (useVisionX ? visionModelsX : textModelsX) : textModelsX).slice(0, 4);
      const text = await callOpenAICompat({
        endpoint: "https://api.x.ai/v1/chat/completions",
        key: keys.xai,
        models: xaiModels,
        prompt, imageBase64, imageMimeType, maxOutputTokens, jsonMode,
        includeImage: useVisionX,
      });
      geminiDebug.lastProvider = "grok";
      geminiDebug.lastError = null;
      return text;
    } catch (err) {
      errors.push(`Grok: ${err.message}`);
      geminiDebug.lastError = errors.join(" | ");
      console.log("⚠️ Grok (xAI) xətası:", err.message);
    }
  }

  if (errors.length) {
    console.log("⚠️ Bütün AI provayderləri xəta verdi, offline rejimə keçilir:", errors.join(" | "));
  } else {
    console.log("⚠️ AI bağlantı açarı tapılmadı. Offline simulyasiya rejimində işləyir.");
  }
  return offlineGenerate(prompt);
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
