"use client";
import { useCallback, useEffect, useState, memo } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";

const ICONS = { success:"checkCircle", error:"closeCircle", warning:"alert", info:"info" };

// Inner rendering component — memoized, stable, receives toasts as a prop.
const ToastContainerInner = memo(function ToastContainerInner({ toasts }) {
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
});

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type="success", duration=3500) => {
    const id = Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), duration);
  }, []);

  // showToast is the same stable reference as toast (useCallback with [])
  const showToast = toast;

  // ToastContainer MUST be an actual function component (callers use it as
  // JSX: <ToastContainer/>). We memoize it with useCallback keyed on
  // `toasts` so its identity only changes when toast content actually
  // changes (rare) — not on every unrelated parent re-render. This is
  // stable enough to prevent remount cascades while staying a valid
  // component (fixes the "objects are not valid as react child" crash
  // from an earlier attempt that returned a JSX element instead of a
  // component function).
  const ToastContainer = useCallback(
    () => <ToastContainerInner toasts={toasts} />,
    [toasts]
  );

  return { toast, showToast, ToastContainer };
}
