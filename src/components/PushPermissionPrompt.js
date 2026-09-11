"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";
import { useSiteTexts } from "@/lib/siteTexts";

/**
 * Push bildiriş izin komponenti.
 * Sistemə daxil olan hər istifadəçidən bildiriş icazəsi istənilir;
 * seçim kukidə (fmk_push_consent) yadda saxlanır ki, təkrar-təkrar
 * narahat etməsin. İcazə verildikdə Service Worker qeydiyyatdan keçir
 * və cihaz /api/push/subscribe üzərindən abunə olunur — beləcə yeni
 * məhsul, endirim kampaniyası və yeni mağaza xəbərləri istifadəçi
 * saytda olmasa belə (telefon, planşet, digər cihaz) push kimi gəlir.
 */

const CONSENT_COOKIE = "fmk_push_consent";

function getCookie(name) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeDevice() {
  // 1) Service Worker qeydiyyata al / mövcud registration-ı gözlə
  const reg = await navigator.serviceWorker.ready;
  // 2) Mövcud abunəlik varsa təkrar yaratma
  const existing = await reg.pushManager.getSubscription();
  if (existing) return true;
  // 3) VAPID public key al
  const res = await fetch("/api/push/vapid-key").then((r) => r.json());
  if (!res?.publicKey) return false;
  // 4) Abunə ol
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(res.publicKey),
  });
  const json = sub.toJSON();
  // 5) Servera qeyd et (login tələb edir; logout vəziyyətində növbəti
  //    girişdə yenidən cəhd olunacaq)
  await apiFetch("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  return true;
}

export default function PushPermissionPrompt() {
  const { t: st } = useSiteTexts();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    if (!supported) return;

    const consent = getCookie(CONSENT_COOKIE);
    const permission = Notification.permission;

    if (consent === "granted" && permission === "granted") {
      // Əvvəl icazə verib — cihazı səssizcə abunə et (məs. login-dən sonra)
      subscribeDevice().catch(() => {});
      return;
    }
    if (consent) return; // "later"/"denied" — narahat etmə
    if (permission === "denied") return; // brauzer səviyyəsində rədd edilib

    // Bir az gözlə, sonra nümayiş et (istifadəçi səhifəyə alışsın)
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Login hadisəsində (icazə artıq verilibsə) avtomatik abunə et
  useEffect(() => {
    function onAuthChange() {
      if (getCookie(CONSENT_COOKIE) === "granted" && Notification.permission === "granted") {
        subscribeDevice().catch(() => {});
      }
    }
    window.addEventListener("fmk-auth-changed", onAuthChange);
    return () => window.removeEventListener("fmk-auth-changed", onAuthChange);
  }, []);

  async function activate() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setCookie(CONSENT_COOKIE, "granted", 365);
        await subscribeDevice().catch(() => {});
      } else {
        setCookie(CONSENT_COOKIE, "denied", 90);
      }
    } catch {
      /* icazə alınmadı — səssiz keç */
    } finally {
      setBusy(false);
      setVisible(false);
    }
  }

  function later() {
    setCookie(CONSENT_COOKIE, "later", 14);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[60] animate-fade-in-up">
      <div className="relative overflow-hidden rounded-2xl bg-gray-900/95 backdrop-blur-md text-white shadow-2xl ring-1 ring-white/10 p-4">
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/20 blur-2xl" />
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
            <Icon name="bell" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug">
              {st("push.promptTitle", "Bildirişləri aktivləşdir")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-300">
              {st(
                "push.promptBody",
                "Yeni məhsul, endirim kampaniyaları və yeni mağazalardan ilk siz xəbər tutun — saytda olmasanız belə telefonunuza bildiriş gələcək."
              )}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={activate}
                disabled={busy}
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all px-4 py-2.5 text-sm font-bold text-gray-900 disabled:opacity-60"
              >
                {busy ? "..." : st("push.activate", "Aktivləşdir")}
              </button>
              <button
                onClick={later}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                {st("push.later", "Sonra")}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-gray-500">
              {st("push.cookieNote", "Seçiminiz kukilərlə yadda saxlanılır")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
