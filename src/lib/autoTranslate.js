import { prisma } from "@/lib/prisma";
import { geminiGenerate } from "@/lib/gemini";

/**
 * AutoTranslate — AI avtomatik tərcümə mərkəzi (az → en + ru).
 * "Həmişə onlayn": gemini.js çoxprovayder zənciri işlədir (Gemini → Groq → xAI).
 * Hər entity üçün 1 AI çağırışı ilə başlıq + təsvir birlikdə çevrilir.
 */

const SYS = `You are a professional translator for an Azerbaijani agricultural marketplace (FermerMarket.az).
Translate the given Azerbaijani text(s) to English and Russian.
Rules: natural marketing tone; keep numbers/units/brand-product names unchanged (e.g. "SECCOZIN-10", "KAS-32", "20L", "₼"); if asked for HTML content, translate only text nodes and keep all tags intact.
Return STRICT JSON only, no markdown fences.`;

const inFlight = new Set();

export function parseJsonLoose(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

/** AZ mətni {en, ru} obyektinə çevirir. Uğursuzsa null. */
export async function translateAz(text, context = "") {
  const clean = (text || "").trim();
  if (!clean) return null;
  try {
    const prompt = `${SYS}\n\nContext: ${context}\nAzerbaijani text:\n"""${clean}"""\n\nReturn: {"en": "...", "ru": "..."}`;
    const out = await geminiGenerate({ prompt, jsonMode: true, maxOutputTokens: 2048 });
    const parsed = parseJsonLoose(out);
    if (parsed && parsed.en && parsed.ru) {
      return { en: String(parsed.en).trim().slice(0, 4000), ru: String(parsed.ru).trim().slice(0, 4000) };
    }
  } catch (e) {
    console.error("translateAz xətası:", e.message);
  }
  return null;
}

/** Məhsul: başlıq + təsviri 1 çağırışda EN/RU-ya çevirir. */
export async function autoTranslateProduct(productId, { force = false } = {}) {
  const tag = "p:" + productId;
  if (inFlight.has(tag)) return { skipped: true };
  inFlight.add(tag);
  try {
    const p = await prisma.product.findUnique({
      where: { id: productId },
      select: { titleAz: true, descriptionAz: true, titleEn: true, titleRu: true, descriptionEn: true, descriptionRu: true },
    });
    if (!p) return { skipped: true };
    const needTitle = force || !p.titleEn || !p.titleRu;
    const needDesc = !!p.descriptionAz && (force || !p.descriptionEn || !p.descriptionRu);
    if (!needTitle && !needDesc) return { skipped: true };

    const prompt = `${SYS}

Context: Product listing on an agricultural marketplace.
Title (AZ): """${p.titleAz}"""
Description (AZ): """${p.descriptionAz || "(no description)"}"""

Return: {"titleEn":"...","titleRu":"...","descEn":"...","descRu":"..."}`;
    const out = await geminiGenerate({ prompt, jsonMode: true, maxOutputTokens: 2048 });
    const parsed = parseJsonLoose(out);
    if (!parsed) return { error: "AI cavabı parse olunmadı" };
    const data = {};
    if (needTitle && parsed.titleEn) { data.titleEn = String(parsed.titleEn).trim().slice(0, 300); data.titleRu = String(parsed.titleRu || "").trim().slice(0, 300); }
    if (needDesc && parsed.descEn) { data.descriptionEn = String(parsed.descEn).trim().slice(0, 4000); data.descriptionRu = String(parsed.descRu || "").trim().slice(0, 4000); }
    if (Object.keys(data).length) await prisma.product.update({ where: { id: productId }, data });
    return { ok: true, fields: Object.keys(data) };
  } catch (e) {
    console.error("autoTranslateProduct:", e.message);
    return { error: e.message };
  } finally {
    inFlight.delete(tag);
  }
}

/** SiteText (menyu/etiket/başlıq) avtomatik tərcüməsi. */
export async function autoTranslateSiteText(key, { force = false } = {}) {
  try {
    const t = await prisma.siteText.findUnique({ where: { key } });
    if (!t || !t.valueAz) return { skipped: true };
    if (!force && t.valueEn && t.valueRu) return { skipped: true };
    const tr = await translateAz(t.valueAz, `Site UI text, key="${t.key}" — short UI label, keep it brief`);
    if (!tr) return { error: "AI cavabı yoxdur" };
    await prisma.siteText.update({ where: { key }, data: { valueEn: tr.en, valueRu: tr.ru } });
    return { ok: true };
  } catch (e) { console.error("autoTranslateSiteText:", e.message); return { error: e.message }; }
}

/** Kateqoriya adı avtomatik tərcüməsi. */
export async function autoTranslateCategory(id, { force = false } = {}) {
  try {
    const c = await prisma.category.findUnique({ where: { id } });
    if (!c) return { skipped: true };
    if (!force && c.nameEn && c.nameRu) return { skipped: true };
    const tr = await translateAz(c.nameAz, "Category name (1-3 words)");
    if (!tr) return { error: "AI cavabı yoxdur" };
    await prisma.category.update({ where: { id }, data: { nameEn: tr.en, nameRu: tr.ru } });
    return { ok: true };
  } catch (e) { console.error("autoTranslateCategory:", e.message); return { error: e.message }; }
}

/** Bloq yazısı: başlıq + məzmun (HTML qorunur). */
export async function autoTranslateBlogPost(id, { force = false } = {}) {
  try {
    const b = await prisma.blogPost.findUnique({ where: { id } });
    if (!b) return { skipped: true };
    if (!force && b.titleEn && b.titleRu) return { skipped: true };
    const tt = await translateAz(b.titleAz, "Blog post title");
    const ct = b.contentAz ? await translateAz(b.contentAz, "Blog article body in HTML — keep tags, translate text nodes") : null;
    await prisma.blogPost.update({
      where: { id },
      data: { ...(tt ? { titleEn: tt.en, titleRu: tt.ru } : {}), ...(ct ? { contentEn: ct.en, contentRu: ct.ru } : {}) },
    });
    return { ok: true };
  } catch (e) { console.error("autoTranslateBlogPost:", e.message); return { error: e.message }; }
}
