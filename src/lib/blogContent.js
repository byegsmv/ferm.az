// Pure string-based, server-safe blog content normalizer + sanitizer.
// No jsdom/DOMPurify needed — safe in server components and Vercel serverless.

/**
 * Normalizes AI-generated (or manually pasted) blog HTML:
 *  - strips ``` / ```html code fences wrapping the content
 *  - unescapes fully HTML-escaped content (&lt;div&gt; -> <div>)
 *  - removes dangerous tags/attributes (script, style, iframe, on* handlers, javascript:)
 *  - drops <html>/<body>/<head> wrappers
 *  - wraps plain text into paragraphs if no HTML present
 */
export function normalizeBlogContent(raw) {
  if (!raw || typeof raw !== "string") return "";
  let out = raw.trim();

  // 1. Whole content wrapped in a ```...``` fence (```html, ```HTML, ...)
  const fence = out.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```$/);
  if (fence) out = fence[1].trim();

  // 2. Fully HTML-escaped content -> unescape once
  if (
    /&lt;(div|p|h[1-6]|ul|ol|li|img|strong|br|em|blockquote|hr)\b/i.test(out) &&
    !/<(div|p|h[1-6]|ul|ol|li|img|strong|br|em|blockquote|hr)\b/i.test(out)
  ) {
    out = out
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&");
  }

  // 3. Stray fence markers anywhere (AI sometimes re-opens them mid-text)
  out = out.replace(/```[a-zA-Z]*\n?/g, "");

  // 4. Dangerous content removal
  out = out
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<script[^>]*>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript\s*:/gi, "");

  // 5. Drop structural document wrappers
  out = out.replace(/<\/?(html|body|head|meta)\b[^>]*>/gi, "");

  // 6. Plain text (no HTML at all) -> wrap into <p> paragraphs
  if (!/<(p|h[1-6]|ul|ol|li|div|img|br|strong|em|b|i|blockquote|hr)\b/i.test(out)) {
    out = out
      .split(/\n{2,}/)
      .map((p) => (p.trim() ? `<p>${p.replace(/\n/g, "<br/>").trim()}</p>` : ""))
      .join("\n");
  }

  return out.trim();
}

/**
 * Plain-text excerpt from blog HTML (for cards, meta descriptions).
 */
export function blogExcerpt(raw, len = 160) {
  if (!raw || typeof raw !== "string") return "";
  const text = normalizeBlogContent(raw)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > len ? text.slice(0, len).trimEnd() + "…" : text;
}
