
"use client";
import { useState, useEffect } from "react";
import Icon from "./ui/Icon";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (window.matchMedia("(display-mode: standalone)").matches || localStorage.getItem("pwaPromptDismissed")) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwaPromptDismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-[99] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200/50 p-4 rounded-3xl shadow-2xl flex items-start gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-700 bg-gray-50/50 rounded-full p-1 transition-colors">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
          <Icon name="smartphone" size={24} className="text-white" />
        </div>
        <div className="flex-1 pr-6">
          <h4 className="font-bold text-gray-900 text-sm">FermerMarket Tətbiqi</h4>
          <p className="text-xs text-gray-500 mt-1 mb-3">Saytı tətbiq kimi quraşdırın, daha sürətli və asan istifadə edin.</p>
          <button 
            onClick={handleInstall}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-md shadow-brand-500/30 active:scale-95"
          >
            İndi Quraşdır
          </button>
        </div>
      </div>
    </div>
  );
}

