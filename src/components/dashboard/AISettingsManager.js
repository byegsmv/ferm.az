"use client";
import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

export default function AISettingsManager() {
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [data, setData] = useState(null);
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/ai-settings");
      setData(res);
    } catch (err) {
      showToast("AI ayarları yüklənmədi", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!newKey.trim()) {
      showToast("Zəhmət olmasa API açarı daxil edin", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/ai-settings", {
        method: "PUT",
        body: JSON.stringify({ geminiApiKey: newKey.trim() }),
      });
      if (res.success) {
        showToast(res.message || "API açarı yeniləndi", "success");
        setNewKey("");
        setShowKey(false);
        setTestResult(null);
        load();
      } else {
        showToast(res.error || "Xəta baş verdi", "error");
      }
    } catch (err) {
      showToast("Yeniləmə uğursuz oldu", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/ai-settings", {
        method: "PUT",
        body: JSON.stringify({ geminiApiKey: "" }),
      });
      if (res.success) {
        showToast(res.message || "API açarı silindi", "success");
        setTestResult(null);
        load();
      }
    } catch (err) {
      showToast("Silinmə uğursuz", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiFetch("/api/admin/ai-settings", { method: "POST" });
      setTestResult(res);
      if (res.success) {
        showToast("API açarı işləyir!", "success");
      } else {
        showToast(res.message || "Test uğursuz", "error");
      }
    } catch (err) {
      setTestResult({ success: false, message: "Bağlantı xətası" });
      showToast("Test uğursuz", "error");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const keySourceLabels = {
    database: { label: "DB-də saxlanır", color: "badge-green" },
    env: { label: "Vercel ENV", color: "badge-blue" },
    none: { label: "Yoxdur", color: "badge-red" },
  };

  const moduleStatusLabels = {
    active: { label: "Aktiv", color: "badge-green" },
    ready: { label: "Hazır", color: "badge-blue" },
    placeholder: { label: "Placeholder", color: "badge-yellow" },
    offline: { label: "Offline", color: "badge-gray" },
  };

  return (
    <div className="space-y-6">
      {/* API Key Management */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Icon name="key" size={20} className="text-brand-600" />
              Gemini API Açarı
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              AI modulları üçün Google Gemini API açarı. Açar bitdikdə buradan dəyişə bilərsiniz.
            </p>
          </div>
          <div className="text-right">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${data?.hasActiveKey ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              {data?.hasActiveKey ? "● Aktiv" : "● Deaktiv"}
            </span>
          </div>
        </div>

        {/* Current key status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Cari açar (DB)</p>
            <p className="font-mono text-sm text-gray-800">{data?.geminiKey || "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Vercel ENV açarı</p>
            <p className="font-mono text-sm text-gray-800">{data?.geminiEnvKey || "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Mənbə</p>
            <p className="text-sm font-semibold text-gray-800">
              {keySourceLabels[data?.geminiKeySource]?.label || "Naməlum"}
            </p>
          </div>
        </div>

        {/* New key input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Yeni API açarı daxil edin</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? "text" : "password"}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon name={showKey ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !newKey.trim()}
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="check" size={16} />}
              {saving ? "Saxlanılır..." : "Saxla"}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            💡 Pulsuz açar: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-brand-600 hover:underline">aistudio.google.com/app/apikey</a> saytından əldə edin
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleTest}
            disabled={testing || !data?.hasActiveKey}
            className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 text-sm font-semibold hover:bg-sky-100 disabled:opacity-50 flex items-center gap-2"
          >
            {testing ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="zap" size={16} />}
            Açarı Test Et
          </button>
          <button
            onClick={handleDelete}
            disabled={saving || !data?.geminiKey}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 flex items-center gap-2"
          >
            <Icon name="trash" size={16} />
            DB açarını sil
          </button>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`mt-3 p-3 rounded-xl text-sm ${testResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            <p className="font-semibold flex items-center gap-2">
              <Icon name={testResult.success ? "checkCircle" : "closeCircle"} size={16} />
              {testResult.message}
            </p>
            {testResult.sample && <p className="mt-1 text-xs opacity-80">Cavab nümunəsi: "{testResult.sample}"</p>}
          </div>
        )}
      </div>

      {/* AI Modules list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="bot" size={20} className="text-brand-600" />
          AI Modulları
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data?.modules || []).map((mod) => {
            const status = moduleStatusLabels[mod.status] || { label: mod.status, color: "badge-gray" };
            return (
              <div key={mod.id} className="border border-gray-100 rounded-xl p-4 hover:border-brand-200 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Icon name={mod.icon || "bot"} size={20} className="text-brand-600" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mt-2">{mod.name}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{mod.description}</p>
                {mod.page && (
                  <a href={mod.page} className="text-xs text-brand-600 hover:underline mt-2 inline-block">
                    Səhifəyə get →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Model info */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <Icon name="info" size={14} />
          İstifadə olunan model: <span className="font-mono font-semibold text-gray-700">{data?.model || "gemini-2.5-flash"}</span>
          {" "}• Açar sorğusu 60 san. keşlənir (admin dəyişiklikdən sonra dərhal tətbiq olunur)
        </p>
      </div>

      <ToastContainer />
    </div>
  );
}
