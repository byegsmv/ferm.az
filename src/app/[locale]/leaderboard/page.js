"use client";
import Icon from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";

const PERIOD_LABELS = { week: "Bu həftə", month: "Bu ay" };
const MEDALS = ["", "", ""];

export default function LeaderboardPage() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard/farmers?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const leaders = data?.leaderboard || [];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3"></div>
          <h1 className="text-2xl font-black text-gray-900">Ayın Fermerləri</h1>
          <p className="text-gray-500 mt-1">Ən çox satış həyata keçirən fermerlər</p>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2 bg-gray-100 rounded-2xl p-1 mb-6 max-w-xs mx-auto">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                period === key ? "bg-white shadow text-brand-700" : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3"></p>
            <p className="text-gray-500">Bu dövr üçün məlumat yoxdur</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((seller, i) => (
              <div
                key={seller.sellerId}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  i === 0 ? "bg-yellow-50 border-yellow-200 shadow-md" :
                  i === 1 ? "bg-gray-50 border-gray-200" :
                  i === 2 ? "bg-orange-50 border-orange-200" :
                  "bg-white border-gray-100"
                }`}
              >
                {/* Rank */}
                <div className="w-10 text-center flex-shrink-0">
                  {i < 3 ? (
                    <span className="text-2xl">{MEDALS[i]}</span>
                  ) : (
                    <span className="text-lg font-black text-gray-400">#{i + 1}</span>
                  )}
                </div>

                {/* Avatar placeholder */}
                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">‍</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">
                    {seller.storeName || seller.fullName}
                  </p>
                  {seller.storeName && (
                    <p className="text-xs text-gray-500 truncate">{seller.fullName}</p>
                  )}
                  {seller.avgRating && (
                    <p className="text-xs text-yellow-600 font-semibold">
                      <span className="inline-flex items-center gap-1"><Icon name="star" size={14} className="text-amber-400 fill-amber-400" /> {seller.avgRating.toFixed(1)}</span>
                    </p>
                  )}
                </div>

                {/* Revenue */}
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-brand-700 text-lg">
                    ₼{seller.revenue >= 1000
                      ? `${(seller.revenue / 1000).toFixed(1)}K`
                      : seller.revenue.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-gray-400">satış</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Sıralama {PERIOD_LABELS[period].toLowerCase()} çatdırılmış sifarişlər əsasında hesablanır
        </p>
      </main>
  );
}
