"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";

export default function Modal({ open, onClose, title, children, size="md" }) {
  useEffect(()=>{
    if (!open) return;
    document.body.style.overflow="hidden";
    const handler = (e)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return ()=>{ document.body.style.overflow=""; window.removeEventListener("keydown",handler); };
  },[open, onClose]);

  if (!open || typeof window==="undefined") return null;

  const widths = { sm:"max-w-sm", md:"max-w-lg", lg:"max-w-2xl", xl:"max-w-4xl" };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="overlay" onClick={onClose} />
      <div className={`relative z-10 w-full ${widths[size]} bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="btn-icon" aria-label="Bağla"><Icon name="close" size={18} /></button>
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}
