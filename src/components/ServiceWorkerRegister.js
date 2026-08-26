"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        // Force update check on every page load
        reg.update();
        // Listen for new SW taking over, then reload to ensure clean state
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });
      }).catch(() => {});
    }
  }, []);
  return null;
}
