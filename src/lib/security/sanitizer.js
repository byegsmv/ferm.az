// Use lightweight dompurify instead of isomorphic-dompurify.
// isomorphic-dompurify requires jsdom which fails to load on Vercel serverless.
// dompurify works in browser; for server-side, we do a basic tag strip.
import DOMPurify from 'dompurify';

const config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3'],
  ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'class'],
  ALLOW_DATA_ATTR: false,
};

// Server-side safe fallback: strip all HTML tags (no DOM available)
function serverSanitize(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  // Remove script/style blocks entirely
  let clean = dirty.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
  return clean;
}

export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  // In browser, use full DOMPurify; on server, use fallback
  if (typeof window !== 'undefined' && window.DOMPurify) {
    return DOMPurify.sanitize(dirty, config);
  }
  // Server-side: use DOMPurify if it initialized (jsdom), otherwise fallback
  try {
    return DOMPurify.sanitize(dirty, config);
  } catch {
    return serverSanitize(dirty);
  }
}

export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  if (typeof window !== 'undefined' && window.DOMPurify) {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  }
  try {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  } catch {
    return text.replace(/<[^>]*>/g, '');
  }
}

export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
}
