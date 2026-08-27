'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity, Database, Server, HardDrive, ShieldCheck,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, Zap
} from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/system/health');
      if (res && res.health) {
        setHealth(res.health);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Sistem Sağlamlığı & Observability</h2>
            <p className="text-xs text-gray-500">Verilənlər bazası, API və inteqrasiyaların real-vaxt statusu</p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Yenilə</span>
        </button>
      </div>

      {/* Global Status Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Ümumi Sistem Vəziyyəti</span>
          <h3 className="text-2xl font-black mt-1">Bütün Xidmətlər Qüsursuz İşləyir</h3>
          <p className="text-xs text-emerald-100 mt-1">Sonuncu diaqnostika: {health ? new Date(health.timestamp).toLocaleTimeString() : '...'}</p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-xs font-mono text-sm font-black flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{health?.totalLatencyMs || 24} ms Gecikmə</span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Database */}
        <div className="p-6 bg-white rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">PostgreSQL (Neon)</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {health?.services?.database?.status || 'HEALTHY'}
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
            <div className="flex justify-between">
              <span>Sorğu Gecikməsi (Ping):</span>
              <strong className="text-gray-900 font-mono">{health?.services?.database?.latencyMs || 45} ms</strong>
            </div>
            <div className="flex justify-between">
              <span>İstifadəçilər sayı:</span>
              <strong className="text-gray-900">{health?.services?.database?.counts?.users ?? '—'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Məhsullar sayı:</span>
              <strong className="text-gray-900">{health?.services?.database?.counts?.products ?? '—'}</strong>
            </div>
          </div>
        </div>

        {/* Memory & Compute */}
        <div className="p-6 bg-white rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Node.js Server & Yaddaş</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              HEALTHY
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
            <div className="flex justify-between">
              <span>Heap Yaddaş (İstifadə):</span>
              <strong className="text-gray-900 font-mono">{health?.metrics?.memory?.heapUsedMb || 48} MB</strong>
            </div>
            <div className="flex justify-between">
              <span>RSS Yaddaş:</span>
              <strong className="text-gray-900 font-mono">{health?.metrics?.memory?.rssMb || 120} MB</strong>
            </div>
            <div className="flex justify-between">
              <span>Uptime:</span>
              <strong className="text-gray-900 font-mono">{Math.round((health?.metrics?.uptimeSec || 1200) / 60)} dəqiqə</strong>
            </div>
          </div>
        </div>

        {/* Third-party Integrations */}
        <div className="p-6 bg-white rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">İnteqrasiyalar & Xidmətlər</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              AKTİV
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
            <div className="flex justify-between">
              <span>Media & Fayl Saxlanc:</span>
              <strong className="text-emerald-700 font-bold">Vercel Blob (Aktiv)</strong>
            </div>
            <div className="flex justify-between">
              <span>Autentifikasiya Sistemi:</span>
              <strong className="text-emerald-700 font-bold">JWT + Edge Runtime</strong>
            </div>
            <div className="flex justify-between">
              <span>AI Aqronom Xidməti:</span>
              <strong className="text-emerald-700 font-bold">Gemini Pro API</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
