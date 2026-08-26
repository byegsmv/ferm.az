"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";

const DAYS_OF_WEEK = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];

const DEFAULT_STATS = {
  totalRevenue: 0,
  ordersCount: 0,
  viewsCount: 0,
  conversionRate: 0,
  revenue7Days: [
    { day: "B.e", amount: 0 },
    { day: "Ç.a", amount: 0 },
    { day: "Ç", amount: 0 },
    { day: "C.a", amount: 0 },
    { day: "C", amount: 0 },
    { day: "Ş", amount: 0 },
    { day: "B", amount: 0 },
  ],
  topProducts: [],
  trafficSources: [
    { name: "Birbaşa (Direct)", percent: 45, color: "bg-brand-500" },
    { name: "Axtarış (Search)", percent: 30, color: "bg-blue-500" },
    { name: "Sosial Medya (Social)", percent: 15, color: "bg-purple-500" },
    { name: "Tövsiyə (Referral)", percent: 10, color: "bg-amber-500" },
  ],
  deviceBreakdown: [
    { name: "Mobil", percent: 68, color: "bg-brand-500" },
    { name: "Masaüstü", percent: 26, color: "bg-blue-500" },
    { name: "Planşet", percent: 6, color: "bg-amber-500" },
  ],
};

export default function StoreAnalytics({ storeId }) {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      setLoading(true);
      const url = storeId ? `/api/stores/${storeId}/stats` : "/api/stores/me/stats";
      try {
        const data = await apiFetch(url);
        if (isMounted && data) {
          setStats({
            totalRevenue: data.totalRevenue ?? data.revenue ?? 0,
            ordersCount: data.ordersCount ?? data.orders ?? 0,
            viewsCount: data.viewsCount ?? data.views ?? 0,
            conversionRate: data.conversionRate ?? data.conversion ?? 0,
            revenue7Days: Array.isArray(data.revenue7Days) && data.revenue7Days.length === 7
              ? data.revenue7Days
              : (data.revenue7Days || DEFAULT_STATS.revenue7Days),
            topProducts: Array.isArray(data.topProducts) ? data.topProducts : [],
            trafficSources: Array.isArray(data.trafficSources) ? data.trafficSources : DEFAULT_STATS.trafficSources,
            deviceBreakdown: Array.isArray(data.deviceBreakdown) ? data.deviceBreakdown : DEFAULT_STATS.deviceBreakdown,
          });
        }
      } catch {
        if (isMounted) {
          setStats(DEFAULT_STATS);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();
    return () => { isMounted = false; };
  }, [storeId]);

  const maxRevenue = Math.max(...stats.revenue7Days.map((d) => Number(d.amount || 0)), 1);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl p-4" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Overview Stats (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Ümumi Gəlir */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ümumi Gəlir</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {Number(stats.totalRevenue || 0).toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Icon name="dollar" size={24} />
          </div>
        </div>

        {/* Card 2: Sifarişlər */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sifarişlər</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.ordersCount || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Icon name="cart" size={24} />
          </div>
        </div>

        {/* Card 3: Baxışlar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Baxışlar</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.viewsCount || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Icon name="eye" size={24} />
          </div>
        </div>

        {/* Card 4: Çevrilmə Faizi */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Çevrilmə Faizi</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {Number(stats.conversionRate || 0).toFixed(1)}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Icon name="percent" size={24} />
          </div>
        </div>
      </div>

      {/* 2. Revenue Chart (7 Days Vertical CSS Bars) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Son 7 Günlük Gəlir Dinamikası</h3>
            <p className="text-xs text-gray-500">Həftəlik satış göstəriciləri</p>
          </div>
          <span className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
            Son 7 gün
          </span>
        </div>

        <div className="h-56 flex items-end justify-between gap-2 md:gap-6 pt-8 pb-2 px-2 border-b border-gray-100">
          {stats.revenue7Days.map((item, idx) => {
            const dayLabel = DAYS_OF_WEEK[idx] || item.day || `Günün ${idx + 1}`;
            const val = Number(item.amount || 0);
            const heightPercent = maxRevenue > 0 ? Math.max((val / maxRevenue) * 100, 6) : 6;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-900 text-white text-[10px] font-medium py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow">
                  {val.toFixed(2)} ₼
                </div>
                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[40px] bg-brand-500 rounded-t-lg transition-all duration-300 group-hover:bg-brand-600 shadow-sm"
                />
                {/* Day Label */}
                <span className="text-xs font-medium text-gray-600 mt-2">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid for Top Products & Traffic/Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Top Products */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Icon name="trophy" size={18} className="text-amber-500" />
            Ən Çox Satılan Məhsullar
          </h3>

          {stats.topProducts.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              <Icon name="package" size={32} className="mx-auto mb-2 opacity-50" />
              Məlumat tapılmadı
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.slice(0, 5).map((prod, idx) => (
                <div
                  key={prod.id || idx}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-bold text-gray-400">
                      #{idx + 1}
                    </span>
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.title || "Product"}
                        className="w-8 h-8 rounded object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                        <Icon name="package" size={16} />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                        {prod.title || "Adsız Məhsul"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {prod.views || 0} baxış · {prod.sales || 0} satış
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">
                      {Number(prod.revenue || 0).toFixed(2)} ₼
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Traffic Sources & Device Breakdown Column */}
        <div className="space-y-6">
          {/* 4. Traffic Sources */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="globe" size={18} className="text-blue-500" />
              Trafik Mənbələri
            </h3>
            <div className="space-y-3">
              {stats.trafficSources.map((source, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-gray-700">
                    <span>{source.name}</span>
                    <span>{source.percent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${source.color || "bg-brand-500"} rounded-full transition-all duration-500`}
                      style={{ width: `${source.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Device Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="smartphone" size={18} className="text-purple-500" />
              Cihaz Növləri
            </h3>
            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden flex mb-4">
              {stats.deviceBreakdown.map((dev, idx) => (
                <div
                  key={idx}
                  style={{ width: `${dev.percent}%` }}
                  className={`h-full ${dev.color || "bg-brand-500"} first:rounded-l-full last:rounded-r-full`}
                  title={`${dev.name}: ${dev.percent}%`}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {stats.deviceBreakdown.map((dev, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-gray-50">
                  <p className="text-[11px] text-gray-500 font-medium">{dev.name}</p>
                  <p className="text-sm font-black text-gray-800 mt-0.5">{dev.percent}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
