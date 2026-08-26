"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";

const ORDER_STATUS_AZ = {
  PENDING:"Gözləyir", PAID:"Ödənilib", PROCESSING:"Hazırlanır",
  SHIPPED:"Göndərilib", DELIVERED:"Çatdırılıb", CANCELLED:"Ləğv edilib", REFUNDED:"Geri qaytarılıb",
};
const ROLE_AZ = { BUYER:"Alıcı", FARMER:"Fermer", STORE:"Mağaza", ADMIN:"Admin", SUPER_ADMIN:"Super Admin", MODERATOR:"Moderator", AGRONOMIST:"Aqronom", DELIVERY_PARTNER:"Kuryer" };

function BarChart({ data, keyName, valueName, colorClass = "bg-brand-500", maxBars = 10 }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 py-4 text-center">Məlumat yoxdur</p>;
  const maxVal = Math.max(...data.map(d => d[valueName] || 0), 1);
  return (
    <div className="space-y-2">
      {data.slice(0, maxBars).map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-24 text-[11px] text-gray-600 truncate text-right flex-shrink-0">{item[keyName]}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className={`h-full ${colorClass} rounded-full transition-all duration-500`}
              style={{ width: `${(item[valueName] / maxVal) * 100}%` }}
            />
          </div>
          <div className="text-[11px] font-semibold text-gray-700 w-12 text-right flex-shrink-0">
            {typeof item[valueName] === "number" && item[valueName] > 0
              ? item[valueName] >= 1000 ? `₼${(item[valueName]/1000).toFixed(1)}K` : item[valueName].toFixed(item[valueName] % 1 !== 0 ? 1 : 0)
              : "0"}
          </div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, dayKey = "day", valueKey = "revenue", label = "Gəlir (₼)" }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 py-4 text-center">Bu dövr üçün məlumat yoxdur</p>;
  const vals = data.map(d => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...vals, 1);
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1 || 1)) * 100,
    y: 100 - (vals[i] / maxVal) * 90,
    value: vals[i],
    day: d[dayKey],
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div>
      <svg viewBox="0 0 100 100" className="w-full h-36" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${pathD} L ${points[points.length-1].x} 100 L 0 100 Z`} fill="url(#chartGrad)" />
        <path d={pathD} fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#16a34a" vectorEffect="non-scaling-stroke"/>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{data[0]?.[dayKey]?.slice(5)}</span>
        <span className="font-semibold text-brand-600">{label}</span>
        <span>{data[data.length-1]?.[dayKey]?.slice(5)}</span>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color = "brand" }) {
  const colors = { brand: "bg-brand-50 text-brand-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", purple: "bg-purple-50 text-purple-700" };
  return (
    <div className={`rounded-2xl p-4 ${colors[color]}`}>
      <div className="mb-1"><Icon name={icon} size={24} /></div>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
      {sub && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── ADMIN ANALYTICS ───
function AdminAnalytics() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/analytics?range=${range}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [range]);

  const totalRevenue = data?.dailyOrders?.reduce((s, d) => s + (d.revenue || 0), 0) || 0;
  const totalOrders = data?.dailyOrders?.reduce((s, d) => s + (d.orders || 0), 0) || 0;
  const totalSignups = data?.dailySignups?.reduce((s, d) => s + (d.signups || 0), 0) || 0;

  return (
    <div className="space-y-5">
      {/* Range selector */}
      <div className="flex gap-2">
        {[7, 30, 90, 365].map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${range === r ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {r} gün
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard icon="wallet" label={`Gəlir (${range} gün)`} value={`₼${totalRevenue.toLocaleString("az-AZ", {maximumFractionDigits:0})}`} color="brand"/>
            <SummaryCard icon="package" label="Sifarişlər" value={totalOrders} color="blue"/>
            <SummaryCard icon="user" label="Yeni qeydiyyat" value={totalSignups} color="purple"/>
            <SummaryCard icon="dashboard" label="Ort. sifariş dəyəri" value={totalOrders ? `₼${(totalRevenue/totalOrders).toFixed(1)}` : "—"} color="amber"/>
          </div>

          {/* Revenue line chart */}
          <div className="card p-4">
            <p className="font-semibold text-sm mb-3">Gündəlik Gəlir</p>
            <LineChart data={data?.dailyOrders || []} dayKey="day" valueKey="revenue" label="Gəlir (₼)"/>
          </div>

          {/* Orders line chart */}
          <div className="card p-4">
            <p className="font-semibold text-sm mb-3">Gündəlik Sifarişlər</p>
            <LineChart data={data?.dailyOrders || []} dayKey="day" valueKey="orders" label="Sifarişlər"/>
          </div>

          {/* Top products */}
          <div className="card p-4">
            <p className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Icon name="trophy" size={16} className="text-amber-500" /> Ən çox satılan məhsullar</p>
            <BarChart data={data?.topProducts || []} keyName="title" valueName="sold" colorClass="bg-brand-500"/>
          </div>

          {/* Top categories */}
          <div className="card p-4">
            <p className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Icon name="folder" size={16} className="text-blue-500" /> Kateqoriya üzrə satış</p>
            <BarChart data={data?.topCategories || []} keyName="category" valueName="sold" colorClass="bg-blue-500"/>
          </div>

          {/* Role breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Icon name="users" size={16} className="text-purple-500" /> İstifadəçi rolları</p>
              <div className="space-y-1.5">
                {(data?.roleBreakdown || []).map(r => (
                  <div key={r.role} className="flex justify-between text-xs">
                    <span className="text-gray-600">{ROLE_AZ[r.role] || r.role}</span>
                    <span className="font-bold">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-4">
              <p className="font-semibold text-sm mb-3">Sifariş statusları</p>
              <div className="space-y-1.5">
                {(data?.orderStatusBreakdown || []).map(r => (
                  <div key={r.status} className="flex justify-between text-xs">
                    <span className="text-gray-600">{ORDER_STATUS_AZ[r.status] || r.status}</span>
                    <span className="font-bold">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── FARMER ANALYTICS ───
function FarmerAnalytics() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/analytics/farmer?range=${range}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[7, 30, 90].map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${range === r ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {r} gün
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i=><div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard icon="package" label="Sifarişlər" value={data?.summary?.totalOrders || 0} color="blue"/>
            <SummaryCard icon="cart" label="Satılan" value={`${data?.summary?.totalSold || 0} ədəd`} color="brand"/>
            <SummaryCard icon="wallet" label="Balans" value={`₼${(data?.summary?.walletBalance || 0).toFixed(2)}`} color="amber"/>
          </div>

          <div className="card p-4">
            <p className="font-semibold text-sm mb-3">Gündəlik Satış Gəliri</p>
            <LineChart data={data?.dailySales || []} dayKey="day" valueKey="revenue" label="Gəlir (₼)"/>
          </div>

          {(data?.revenueByProduct || []).length > 0 && (
            <div className="card p-4">
              <p className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Icon name="trophy" size={16} className="text-amber-500" /> Məhsul üzrə gəlir</p>
              <BarChart data={data?.revenueByProduct || []} keyName="title" valueName="revenue" colorClass="bg-emerald-500"/>
            </div>
          )}

          {(data?.activeProducts || []).length > 0 && (
            <div className="card p-4">
              <p className="font-semibold text-sm mb-3">Aktiv Məhsullarım</p>
              <div className="space-y-2">
                {data.activeProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-800 truncate mr-2">{p.titleAz}</span>
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500">
                      <span>Stok: <b>{p.stock}</b></span>
                      <span className="text-brand-700 font-bold">₼{Number(p.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AnalyticsPanel({ mode = "admin" }) {
  return mode === "farmer" ? <FarmerAnalytics /> : <AdminAnalytics />;
}
