"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";

function CalculatorContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("ha");
  const [norm, setNorm] = useState("");
  const [normUnit, setNormUnit] = useState("L/ha");
  const [waterNorm, setWaterNorm] = useState("200");
  const [showManualNorm, setShowManualNorm] = useState(!productId);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (productId) {
      fetch(`/api/products/${productId}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.product?.useNorm) {
            setShowManualNorm(true);
          }
        })
        .catch(() => setShowManualNorm(true));
    }
  }, [productId]);

  const calculate = async (e) => {
    e.preventDefault();
    if (!area) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/calculator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId: productId || undefined,
          manualUseNorm: norm,
          manualWaterNorm: waterNorm,
          area: parseFloat(area),
          areaUnit
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Hesablama xətası baş verdi");
      }

      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Məhsul və Su Sərfiyyatı Kalkulyatoru</h1>
        <p className="text-gray-600">
          Tarlanızın sahəsinə görə nə qədər dərman/gübrə və su lazım olduğunu asanlıqla hesablayın.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <form onSubmit={calculate} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Əkin sahəsi</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={area} 
                  onChange={(e) => setArea(e.target.value)}
                  className="flex-grow p-3 outline-none"
                  placeholder="Məsələn: 5"
                  required
                />
                <select 
                  value={areaUnit} 
                  onChange={(e) => setAreaUnit(e.target.value)}
                  className="bg-gray-50 border-l border-gray-200 px-4 font-medium outline-none"
                >
                  <option value="ha">Hektar (ha)</option>
                  <option value="sot">Sot (sot)</option>
                  <option value="m2">Kvadrat metr (m²)</option>
                </select>
              </div>
            </div>

            {(!productId || showManualNorm) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Məhsulun sərfiyyat norması</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={norm} 
                    onChange={(e) => setNorm(e.target.value)}
                    className="flex-grow p-3 outline-none"
                    placeholder="Məs: 1.5"
                    required
                  />
                  <select 
                    value={normUnit} 
                    onChange={(e) => setNormUnit(e.target.value)}
                    className="bg-gray-50 border-l border-gray-200 px-4 font-medium outline-none"
                  >
                    <option value="L/ha">L/ha</option>
                    <option value="kg/ha">kq/ha</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {(!productId || showManualNorm) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tövsiyə olunan Su norması (L/ha)</label>
              <input 
                type="number" 
                value={waterNorm} 
                onChange={(e) => setWaterNorm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 outline-none"
                placeholder="Adətən 200 - 400 L"
              />
              <p className="text-xs text-gray-500 mt-1">Əgər etiketdə fərqli qeyd olunmayıbsa, standart olaraq 1 hektar üçün 200-300 Litr su götürülür.</p>
            </div>
          )}

          {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50">
            {loading ? "Hesablanır..." : "Hesabla"}
          </button>
        </form>

        {result && (
          <div className="mt-8 p-6 bg-brand-50 border border-brand-200 rounded-2xl">
            <h3 className="font-bold text-brand-800 mb-4 flex items-center gap-2">
              <Icon name="checkCircle" size={20} /> Hesablama Nəticəsi: {result.productName}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                  <Icon name="sprout" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Tələb olunan Məhsul</p>
                  <p className="text-2xl font-black text-gray-900">{result.totalAmount} <span className="text-base font-semibold">{result.isLiquid ? "Litr" : "Kiloqram"}</span></p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                  <Icon name="droplet" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Tələb olunan Su</p>
                  <p className="text-2xl font-black text-gray-900">{result.totalWater} <span className="text-base font-semibold">Litr</span></p>
                </div>
              </div>
            </div>

            {result.totalCost > 0 && (
              <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-brand-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center">
                  <Icon name="dollar" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Ümumi Dəyər (Təxmini)</p>
                  <p className="text-xl font-bold text-gray-900">{result.totalCost} {result.currency}</p>
                </div>
              </div>
            )}

            {result.optimizedPackages && result.optimizedPackages.length > 0 && (
              <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-brand-100">
                <p className="text-sm text-gray-500 font-medium mb-2 flex items-center gap-2">
                  <Icon name="package" size={16} /> Tövsiyə olunan Paketlər
                </p>
                <ul className="space-y-1">
                  {result.optimizedPackages.map((pkg, idx) => (
                    <li key={idx} className="text-gray-800 font-medium text-sm">
                      {pkg.qty} ədəd - {pkg.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-brand-700/70 mt-4 text-center">
              Bu kalkulyator yalnız təxmini hesablamalar üçündür. Dəqiq dozajlar üçün məhsul etiketindəki təlimatlara və ya aqronomunuzun məsləhətinə müraciət edin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Yüklənir...</div>}>
      <CalculatorContent />
    </Suspense>
  );
}
