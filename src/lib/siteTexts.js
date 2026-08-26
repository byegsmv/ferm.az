"use client";

import { useEffect, useState, useCallback } from "react";

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

export function t(key, fallback = "") {
  if (!cache || !cache[key]) return fallback;
  return cache[key].az || fallback;
}

export function useSiteTexts() {
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
    if (!texts[key]) return fallback;
    return texts[key].az || fallback;
  }, [texts]);

  return { texts, t, loading };
}
