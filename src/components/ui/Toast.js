"use client";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";

const ICONS = { success:"checkCircle", error:"closeCircle", warning:"alert", info:"info" };

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type="success", duration=3500) => {
    const id = Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), duration);
  }, []);

  // Alias for compatibility with new admin components
  const showToast = toast;

  function ToastContainer() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
      <div className="fixed bottom-24 md:bottom-6 right-4 z-[200] space-y-2 pointer-events-none">
        {toasts.map(t=>(
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 bg-white rounded-2xl border border-gray-100 shadow-2xl p-4 max-w-xs w-full animate-slide-right">
            <Icon name={ICONS[t.type]} size={20} className={`shrink-0 ${t.type === "success" ? "text-emerald-500" : t.type === "error" ? "text-red-500" : t.type === "warning" ? "text-amber-500" : "text-sky-500"}`} />
            <p className="text-sm font-medium text-gray-800 leading-snug">{t.msg}</p>
          </div>
        ))}
      </div>,
      document.body
    );
  }
  return { toast, showToast, ToastContainer };
}
