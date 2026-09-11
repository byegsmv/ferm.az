"use client";
import { useEffect } from "react";

/**
 * Ödemeli reklam (Meta/Facebook, Instagram, TikTok, Google) izleme pikselleri.
 * HEPSİ koşulludur: NEXT_PUBLIC_* ID değişkenleri Vercel/dashboard'da
 * TANIMLANMADIĞI sürece hiçbir script yüklenmez — canlı siteye sıfır etki.
 * Elgün reklam hesabı açıp ID'leri verdikten sonra Vercel env'e eklenecek:
 *   NEXT_PUBLIC_META_PIXEL_ID     (Meta/Facebook + Instagram reklamları)
 *   NEXT_PUBLIC_TIKTOK_PIXEL_ID   (TikTok reklamları)
 *   NEXT_PUBLIC_GOOGLE_TAG_ID     (Google Ads / GA4 — AW-... veya G-...)
 */
export default function AdPixels() {
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const tiktokId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;

  useEffect(() => {
    // ── Meta (Facebook/Instagram) Pixel ──
    if (metaId && !window.fbq) {
      /* eslint-disable */
      (function (f, b, e, v) {
        if (f.fbq) return; const n = (f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        });
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        const t = b.createElement(e); t.async = !0; t.src = v;
        const s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", metaId);
      window.fbq("track", "PageView");
      /* eslint-enable */
    }

    // ── TikTok Pixel ──
    if (tiktokId && !window.ttq) {
      /* eslint-disable */
      (function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        const ttq = (w[t] = w[t] || []);
        ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
        ttq.setAndDefer = function (obj, method) {
          obj[method] = function () { obj.push([method].concat(Array.prototype.slice.call(arguments, 0))); };
        };
        for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.load = function (e) {
          const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = url;
          ttq._t = ttq._t || {}; ttq._t[e] = +new Date; ttq._o = ttq._o || {}; ttq._o[e] = {};
          const script = d.createElement("script");
          script.type = "text/javascript"; script.async = !0; script.src = url + "?sdkid=" + e + "&lib=" + t;
          const first = d.getElementsByTagName("script")[0];
          first.parentNode.insertBefore(script, first);
        };
        ttq.load(tiktokId);
        ttq.page();
      })(window, document, "ttq");
      /* eslint-enable */
    }
  }, [metaId, tiktokId]);

  // ── Google (gtag.js — Google Ads + GA4) ──
  useEffect(() => {
    if (!googleTagId) return;
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${googleTagId}`;
    document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", googleTagId);
  }, [googleTagId]);

  if (!metaId && !tiktokId && !googleTagId) return null;
  return null;
}
