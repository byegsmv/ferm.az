"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";

let cache = null;
let fetchPromise = null;

export async function getSiteTexts() {
  if (cache) return cache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/site-texts")
    .then((r) => r.json())
    .then((data) => {
      cache = data || {};
      return cache;
    })
    .catch(() => {
      cache = {};
      return cache;
    });

  return fetchPromise;
}

export function clearSiteTextsCache() {
  cache = null;
  fetchPromise = null;
}

// Module-level helper — defaults to "az" since it has no locale context.
// Prefer useSiteTexts() inside components; this is kept for any non-hook callers.
export function t(key, fallback = "") {
  if (!cache || !cache[key]) return fallback;
  return cache[key].az || fallback;
}

export function useSiteTexts() {
  const locale = useLocale();
  const [texts, setTexts] = useState(cache || {});
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setTexts(cache);
      setLoading(false);
      return;
    }

    getSiteTexts().then((data) => {
      setTexts(data);
      setLoading(false);
    });
  }, []);

  const t = useCallback((key, fallback = "") => {
    const entry = texts[key];
    if (!entry) return fallback;
    // Fall back through the requested locale -> az -> given fallback,
    // so a text that has no EN/RU translation yet still shows something
    // sensible instead of silently staying in Azerbaijani.
    return entry[locale] || entry.az || fallback;
  }, [texts, locale]);

  return { texts, t, loading, locale };
}
