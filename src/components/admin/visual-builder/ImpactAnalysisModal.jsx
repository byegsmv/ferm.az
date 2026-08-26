'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, X } from 'lucide-react';

export default function ImpactAnalysisModal({ isOpen, onClose, onConfirmPublish, isPublishing = false, pages = [] }) {
  if (!isOpen) return null;

  const totalSections = pages.reduce((acc, p) => acc + (p.sections?.length || 0), 0);
  const totalComponents = pages.reduce((acc, p) => acc + (p.sections?.reduce((sAcc, s) => sAcc + (s.components?.length || 0), 0) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-brand-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Təhlükəsizlik & Dəyişiklik Təsiri Analizi</h3>
              <p className="text-xs text-brand-100">Canlı sistemə tətbiq etməzdən əvvəl yoxlanış</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="block text-xl font-black text-gray-900">{pages.length}</span>
              <span className="text-[11px] text-gray-500 font-semibold uppercase">Səhifə</span>
            </div>
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="block text-xl font-black text-brand-600">{totalSections}</span>
              <span className="text-[11px] text-gray-500 font-semibold uppercase">Bölmə</span>
            </div>
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="block text-xl font-black text-indigo-600">{totalComponents}</span>
              <span className="text-[11px] text-gray-500 font-semibold uppercase">Komponent</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Sistem Yoxlanış Nəticələri</h4>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center gap-3 text-emerald-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Database Qorunması:</strong> Core PostgreSQL şeması və cədvəllər toxunulmaz saxlanılır.</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center gap-3 text-emerald-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Avtomatik Versiya:</strong> Yeni versiya snapshot-ı qeyd olunacaq (İstənilən vaxt Rollback mümkündür).</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center gap-3 text-blue-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>Audit Log:</strong> Dəyişiklik edən inzibatçının fəaliyyəti sistem jurnalında qeydə alınır.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200/60 rounded-xl transition-all"
          >
            Geri Qayıt
          </button>
          <button
            onClick={onConfirmPublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <span>{isPublishing ? 'Dərc edilir...' : 'Təsdiqlə və Canlıya Çıxar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
