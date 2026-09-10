/**
 * translate-backfill.mjs — mövcud məzmunu AI ilə EN+RU-ya çevirir (bir dəfəlik).
 * İstifadə: node scripts/translate-backfill.mjs [--force]
 * DB: .env.production-dəki DATABASE_URL; AI açarlar: Setting cədvəlindən.
 */
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const FORCE = process.argv.includes("--force");

// .env.production-i oxu
const env = {};
for (const line of fs.readFileSync(".env.production", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });

const SYS = `You are a professional translator for an Azerbaijani agricultural marketplace (FermerMarket.az).
Translate the given Azerbaijani text(s) to English and Russian.
Rules: natural marketing tone; keep numbers/units/brand-product names unchanged (e.g. "SECCOZIN-10", "KAS-32", "20L"); for HTML content translate only text nodes, keep tags intact.
Return STRICT JSON only, no markdown fences.`;

async function loadKeys() {
  const settings = await prisma.setting.findMany({ where: { key: { in: ["geminiApiKey", "groqApiKey", "huggingfaceApiKey", "togetherApiKey"] }, category: "ai" } });
  const keys = { gemini: "", groq: "", xai: "" };
  for (const s of settings) {
    const v = (s.value || "").trim();
    if (/^AIza/.test(v)) keys.gemini = keys.gemini || v;
    else if (/^gsk_/.test(v)) keys.groq = keys.groq || v;
    else if (/^xai-/.test(v)) keys.xai = keys.xai || v;
  }
  // env fallback
  if (!keys.groq && env.GROQ_API_KEY) keys.groq = env.GROQ_API_KEY;
  return keys;
}

let groqModel = null;
async function groqChat(key, prompt) {
  if (!groqModel) {
    const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${key}` } });
    const d = await r.json();
    const ids = (d.data || []).map(m => m.id);
    groqModel = ids.find(id => /llama-3\.3-70b/.test(id)) || ids.find(id => /llama-3\.1-8b/.test(id)) || ids.find(id => /gpt-oss-120b/.test(id)) || ids[0];
    console.log("Groq model:", groqModel);
  }
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: groqModel,
      messages: [{ role: "system", content: SYS }, { role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });
  if (r.status === 429) {
    // Rate limit — 65 saniyə gözlə, 3 dəfə yenidən cəhd et
    for (let i = 0; i < 3; i++) {
      await new Promise(res => setTimeout(res, 65000));
      const rr = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: "system", content: SYS }, { role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        }),
      });
      if (rr.ok) {
        const dd = await rr.json();
        return dd.choices?.[0]?.message?.content || "";
      }
    }
    throw new Error("Groq 429 (3 retrydan sonra da)");
  }
  if (!r.ok) throw new Error(`Groq ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "";
}

async function geminiChat(key, prompt) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function aiJson(prompt, keys) {
  const providers = [];
  if (keys.groq) providers.push(["groq", keys.groq]);
  if (keys.gemini) providers.push(["gemini", keys.gemini]);
  const errs = [];
  for (const [name, key] of providers) {
    try {
      const raw = name === "groq" ? await groqChat(key, prompt) : await geminiChat(key, prompt);
      let s = raw.trim().replace(/^```(json)?\s*/i, "").replace(/```\s*$/, "");
      const m = s.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("JSON tapılmadı");
      return JSON.parse(m[0]);
    } catch (e) { errs.push(`${name}: ${e.message}`); }
  }
  throw new Error(errs.join(" | ") || "AI açar yoxdur");
}

const stats = { products: 0, categories: 0, siteTexts: 0, blogs: 0, errors: [] };

async function main() {
  const keys = await loadKeys();
  console.log("AI açarlar:", { gemini: !!keys.gemini, groq: !!keys.groq, xai: !!keys.xai });
  if (!keys.groq && !keys.gemini) throw new Error("Heç bir etibarlı AI açarı yoxdur (Setting cədvəli, category=ai)");

  // 1) Məhsullar
  const products = await prisma.product.findMany({
    where: FORCE ? {} : { OR: [{ titleEn: null }, { titleRu: null }] },
    select: { id: true, titleAz: true, descriptionAz: true },
  });
  console.log(`Məhsullar: ${products.length}`);
  for (const p of products) {
    try {
      const j = await aiJson(`Title (AZ): """${p.titleAz}"""\nDescription (AZ): """${p.descriptionAz || "(yoxdur)"}"""\n\nReturn: {"titleEn":"...","titleRu":"...","descEn":"...","descRu":"..."}`, keys);
      await prisma.product.update({ where: { id: p.id }, data: { titleEn: j.titleEn?.slice(0,300), titleRu: j.titleRu?.slice(0,300), ...(p.descriptionAz ? { descriptionEn: j.descEn?.slice(0,4000), descriptionRu: j.descRu?.slice(0,4000) } : {}) } });
      stats.products++;
      console.log(`  ✓ ${p.titleAz.slice(0, 40)}`);
    } catch (e) { stats.errors.push(`P:${p.id} ${e.message.slice(0,100)}`); console.log(`  ✗ ${p.titleAz.slice(0, 40)} — ${e.message.slice(0, 80)}`); }
  }

  // 2) Kateqoriyalar
  const cats = await prisma.category.findMany({
    where: FORCE ? {} : { OR: [{ nameEn: null }, { nameRu: null }] },
    select: { id: true, nameAz: true }, take: 200,
  });
  console.log(`Kateqoriyalar: ${cats.length}`);
  for (const c of cats) {
    try {
      const j = await aiJson(`Category name (AZ): """${c.nameAz}"""\n\nReturn: {"en":"...","ru":"..."}`, keys);
      await prisma.category.update({ where: { id: c.id }, data: { nameEn: j.en?.slice(0,150), nameRu: j.ru?.slice(0,150) } });
      stats.categories++;
    } catch (e) { stats.errors.push(`C:${c.id} ${e.message.slice(0,100)}`); console.log(`  ✗ ${c.nameAz} — ${e.message.slice(0, 80)}`); }
  }

  // 3) Site textlər (menyu, etiketlər)
  const texts = await prisma.siteText.findMany({
    where: FORCE ? { valueAz: { not: "" } } : { OR: [{ valueEn: null }, { valueRu: null }] },
    select: { key: true, valueAz: true }, take: 400,
  });
  console.log(`Site textlər: ${texts.length}`);
  for (const t of texts) {
    if (!t.valueAz?.trim()) continue;
    try {
      const j = await aiJson(`Site UI text, key="${t.key}" (short UI label — keep it brief). Text (AZ): """${t.valueAz}"""\n\nReturn: {"en":"...","ru":"..."}`, keys);
      await prisma.siteText.update({ where: { key: t.key }, data: { valueEn: j.en?.slice(0,500), valueRu: j.ru?.slice(0,500) } });
      stats.siteTexts++;
    } catch (e) { stats.errors.push(`T:${t.key} ${e.message.slice(0,100)}`); console.log(`  ✗ ${t.key} — ${e.message.slice(0, 80)}`); }
  }

  // 4) Bloqlar
  const blogs = await prisma.blogPost.findMany({
    where: FORCE ? {} : { OR: [{ titleEn: null }, { titleRu: null }] },
    select: { id: true, titleAz: true, contentAz: true }, take: 50,
  });
  console.log(`Bloqlar: ${blogs.length}`);
  for (const b of blogs) {
    try {
      const j = await aiJson(`Blog title (AZ): """${b.titleAz}"""\nBody (AZ): """${(b.contentAz || "").slice(0, 8000)}"""\n\nReturn: {"titleEn":"...","titleRu":"...","contentEn":"...","contentRu":"..."}`, keys);
      await prisma.blogPost.update({ where: { id: b.id }, data: { titleEn: j.titleEn, titleRu: j.titleRu, ...(b.contentAz ? { contentEn: j.contentEn, contentRu: j.contentRu } : {}) } });
      stats.blogs++;
    } catch (e) { stats.errors.push(`B:${b.id} ${e.message.slice(0,100)}`); console.log(`  ✗ ${b.titleAz} — ${e.message.slice(0, 80)}`); }
  }

  console.log("\n═══ NƏTİCƏ:", JSON.stringify(stats));
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
