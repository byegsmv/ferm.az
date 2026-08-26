/**
 * Permissive sanitizer for external ad network embeds (Google AdSense, Ad Manager, etc).
 *
 * Unlike sanitizeHtml() — which strips <script>, <iframe>, <style>, <object>, <embed> —
 * this allows those tags so ad network JavaScript can execute properly.
 *
 * Security measures:
 * - Still strips javascript: URLs from href/src attributes
 * - Strips all on* event handler attributes (onclick, onerror, etc.)
 * - Limits output to 30KB to prevent abuse
 */
import DOMPurify from 'dompurify';

const AD_ALLOWED_TAGS = [
  'script', 'iframe', 'ins', 'div', 'span', 'img', 'a', 'p', 'br',
  'ul', 'ol', 'li', 'b', 'i', 'strong', 'em', 'h1', 'h2', 'h3',
  'style', 'link', 'noscript',
];

const AD_ALLOWED_ATTR = [
  'src', 'async', 'defer', 'type', 'charset', 'crossorigin',
  'integrity', 'data-ad-client', 'data-ad-slot', 'data-ad-format',
  'data-ad-layout', 'data-ad-layout-key', 'data-full-width-responsive',
  'class', 'id', 'style', 'width', 'height', 'alt', 'title',
  'href', 'target', 'rel', 'sandbox', 'frameborder', 'scrolling',
  'allow', 'allowfullscreen', 'loading',
  'data-*', // Allow all data-* attributes (AdSense uses these heavily)
];

const AD_FORBID_ATTR = [
  'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
  'onblur', 'onchange', 'onsubmit', 'oninput', 'onkeydown',
  'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup',
];

function serverSanitizeAdCode(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  // Remove inline event handlers and javascript: URLs only
  return dirty
    .replace(/\s*on\w+="[^"]*"/gi, '')
    .replace(/\s*on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export function sanitizeAdCode(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  if (dirty.length > 30000) {
    console.warn('sanitizeAdCode: snippet too long, truncating to 30KB');
    dirty = dirty.slice(0, 30000);
  }

  if (typeof window !== 'undefined' && window.DOMPurify) {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: AD_ALLOWED_TAGS,
      ALLOWED_ATTR: AD_ALLOWED_ATTR,
      ALLOW_DATA_ATTR: true,
      ADD_TAGS: ['ins', 'noscript'],
      FORBID_ATTR: AD_FORBID_ATTR,
      ADD_ATTR: ['target'],
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });
  }

  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: AD_ALLOWED_TAGS,
      ALLOWED_ATTR: AD_ALLOWED_ATTR,
      ALLOW_DATA_ATTR: true,
      ADD_TAGS: ['ins', 'noscript'],
      FORBID_ATTR: AD_FORBID_ATTR,
      ADD_ATTR: ['target'],
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });
  } catch {
    return serverSanitizeAdCode(dirty);
  }
}
