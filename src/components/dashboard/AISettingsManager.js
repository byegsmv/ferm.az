"use client";
import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

// Reusable API Key Card Component
function ApiKeyCard({ title, description, value, envValue, source, placeholder, link, onSave, onTest, onClear }) {
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { showToast, ToastContainer } = useToast();

  const keySourceLabels = {
    database: { label: "DB-də", color: "bg-emerald-50 text-emerald-600" },
    env: { label: "ENV", color: "bg-blue-50 text-blue-600" },
    none: { label: "Yoxdur", color: "bg-red-50 text-red-600" },
  };

  const handleSave = async () => {
    if (!newKey.trim()) { showToast("Açar daxil edin", "warning"); return; }
    setSaving(true);
    try {
      const res = await onSave(newKey.trim());
      if (res.success || !res.error) {
        showToast("Açar saxlanıldı", "success");
        setNewKey("");
        setShowKey(false);
        setTestResult(null);
        window.location.reload();
      } else showToast(res.error || "Xəta", "error");
    } catch { showToast("Xəta", "error"); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await onTest();
      setTestResult(res);
      showToast(res?.success ? "İşləyir!" : (res?.message || "Test uğursuz"), res?.success ? "success" : "error");
    } catch { setTestResult({ success: false, message: "Bağlantı xətası" }); }
    finally { setTesting(false); }
  };

  const handleClear = async () => {
    try {
      const res = await onClear();
      if (res.success || !res.error) { showToast("Açar silindi", "success"); window.location.reload(); }
    } catch { showToast("Xəta", "error"); }
  };

  return (
    <div className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${keySourceLabels[source]?.color || ""}`}>
          {keySourceLabels[source]?.label || "—"}
        </span>
      </div>

      {/* Current key display */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[10px] text-gray-400 mb-0.5">DB</p>
          <p className="font-mono text-xs text-gray-700 truncate">{value ? `${value.slice(0, 4)}...${value.slice(-4)}` : "—"}</p>
        </div>
        {envValue && (
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-[10px] text-gray-400 mb-0.5">ENV</p>
            <p className="font-mono text-xs text-gray-700 truncate">{envValue ? `${envValue.slice(0, 4)}...${envValue.slice(-4)}` : "—"}</p>
          </div>
        )}
      </div>

      {/* New key input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? "text" : "password"}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 pr-8 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <Icon name="eye" size={14} />
          </button>
        </div>
        <button onClick={handleSave} disabled={saving || !newKey.trim()}
          className="px-3 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50">
          {saving ? "..." : "Saxla"}
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        <button onClick={handleTest} disabled={testing || !value}
          className="px-3 py-1 rounded bg-sky-50 text-sky-700 text-[11px] font-medium hover:bg-sky-100 disabled:opacity-50">
          {testing ? "..." : "Test"}
        </button>
        <button onClick={handleClear} disabled={!value}
          className="px-3 py-1 rounded bg-red-50 text-red-600 text-[11px] font-medium hover:bg-red-100 disabled:opacity-50">
          Sil
        </button>
        <a href={link} target="_blank" rel="noopener" className="px-3 py-1 rounded bg-gray-100 text-gray-600 text-[11px] font-medium hover:bg-gray-200">
          Açar Al
        </a>
      </div>

      {testResult && (
        <div className={`mt-2 p-2 rounded text-xs ${testResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {testResult.message}
        </div>
      )}
    </div>
  );
}

export default function AISettingsManager() {
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [data, setData] = useState(null);
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModule, setNewModule] = useState({ id: "", name: "", description: "", endpoint: "", icon: "bot" });

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
    if (!newKey.trim()) { showToast("Zəhmət olmasa API açarı daxil edin", "warning"); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/ai-settings", {
        method: "PUT",
        body: JSON.stringify({ geminiApiKey: newKey.trim() }),
      });
      if (res.success) {
        showToast(res.message || "API açarı yeniləndi", "success");
        setNewKey(""); setShowKey(false); setTestResult(null);
        load();
      } else showToast(res.error || "Xəta baş verdi", "error");
    } catch (err) { showToast("Yeniləmə uğursuz", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/ai-settings", {
        method: "PUT", body: JSON.stringify({ geminiApiKey: "" }),
      });
      if (res.success) { showToast(res.message || "API açarı silindi", "success"); setTestResult(null); load(); }
    } catch (err) { showToast("Silinmə uğursuz", "error"); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await apiFetch("/api/admin/ai-settings", { method: "POST" });
      setTestResult(res);
      showToast(res.success ? "API açarı işləyir!" : (res.message || "Test uğursuz"), res.success ? "success" : "error");
    } catch (err) { setTestResult({ success: false, message: "Bağlantı xətası" }); showToast("Test uğursuz", "error"); }
    finally { setTesting(false); }
  };

  const handleToggleModule = async (modId, currentActive) => {
    try {
      const res = await apiFetch("/api/admin/ai-settings", {
        method: "PUT",
        body: JSON.stringify({ moduleId: modId, moduleActive: !currentActive }),
      });
      if (res.success) {
        showToast(res.message, "success");
        load();
      } else showToast(res.error || "Xəta", "error");
    } catch (err) { showToast("Əməliyyat uğursuz", "error"); }
  };

  const handleAddModule = async () => {
    if (!newModule.id.trim() || !newModule.name.trim()) {
      showToast("Modul ID və adı tələb olunur", "warning"); return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/ai-settings", {
        method: "PUT",
        body: JSON.stringify({ newModule: { ...newModule, id: newModule.id.trim().toLowerCase().replace(/\s+/g, "-") } }),
      });
      if (res.success) {
        showToast(res.message, "success");
        setShowAddModule(false);
        setNewModule({ id: "", name: "", description: "", endpoint: "", icon: "bot" });
        load();
      } else showToast(res.error || "Xəta", "error");
    } catch (err) { showToast("Əlavə uğursuz", "error"); }
    finally { setSaving(false); }
  };

  const handleDeleteModule = async (modId) => {
    if (!confirm("Bu modulu silmək istədiyinizə əminsiniz?")) return;
    try {
      const res = await apiFetch("/api/admin/ai-settings", {
        method: "PUT",
        body: JSON.stringify({ deleteModuleId: modId }),
      });
      if (res.success) { showToast(res.message, "success"); load(); }
      else showToast(res.error || "Xəta", "error");
    } catch (err) { showToast("Silinmə uğursuz", "error"); }
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
    database: { label: "DB-də saxlanır", color: "bg-emerald-50 text-emerald-600" },
    env: { label: "Vercel ENV", color: "bg-blue-50 text-blue-600" },
    none: { label: "Yoxdur", color: "bg-red-50 text-red-600" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icon name="bot" size={24} className="text-brand-600" />
            AI Modulları
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            AI modullarını idarə edin, Gemini API açarını dəyişin, yeni modullar əlavə edin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${data?.hasActiveKey ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {data?.hasActiveKey ? "● API Aktiv" : "● API Deaktiv"}
          </span>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="key" size={20} className="text-brand-600" />
          API Açarları
        </h3>

        {/* Gemini API Key */}
        <ApiKeyCard
          title="Gemini API"
          description="AI Agent, Tərcümə, Məzmun generasiyası"
          value={data?.geminiKey || ""}
          envValue={data?.geminiEnvKey || ""}
          source={data?.geminiKeySource || "none"}
          placeholder="AIzaSy..."
          link="https://aistudio.google.com/app/apikey"
          onSave={async (key) => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ geminiApiKey: key }) })}
          onTest={async () => await apiFetch("/api/admin/ai-settings", { method: "POST" })}
          onClear={async () => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ geminiApiKey: "" }) })}
        />

        {/* Resend API Key */}
        <ApiKeyCard
          title="Resend API"
          description="Email göndərmə servisi"
          value={data?.resendKey || ""}
          source={data?.resendKeySource || "none"}
          placeholder="re_..."
          link="https://resend.com/api-keys"
          onSave={async (key) => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ resendApiKey: key }) })}
          onTest={async () => await apiFetch("/api/admin/ai-settings?action=test-resend", { method: "POST" })}
          onClear={async () => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ resendApiKey: "" }) })}
        />

        {/* Sentry DSN */}
        <ApiKeyCard
          title="Sentry DSN"
          description="Error tracking və monitoring"
          value={data?.sentryDsn || ""}
          source={data?.sentryDsnSource || "none"}
          placeholder="https://...@sentry.io/..."
          link="https://sentry.io/settings"
          onSave={async (key) => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ sentryDsn: key }) })}
          onTest={async () => ({ success: true, message: "DSN formatı düzgündür" })}
          onClear={async () => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ sentryDsn: "" }) })}
        />

        {/* Alpha Vantage */}
        <ApiKeyCard
          title="Alpha Vantage"
          description="Kənd təsərrüfatı qiymət indeksləri"
          value={data?.alphaVantageKey || ""}
          source={data?.alphaVantageKeySource || "none"}
          placeholder="..."
          link="https://www.alphavantage.co/support/#api-key"
          onSave={async (key) => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ alphaVantageKey: key }) })}
          onTest={async () => await apiFetch("/api/admin/ai-settings?action=test-alphavantage", { method: "POST" })}
          onClear={async () => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ alphaVantageKey: "" }) })}
        />

        {/* OpenAI API Key */}
        <ApiKeyCard
          title="OpenAI API"
          description="Alternativ AI modeli (GPT-4, etc.)"
          value={data?.openaiKey || ""}
          source={data?.openaiKeySource || "none"}
          placeholder="sk-..."
          link="https://platform.openai.com/api-keys"
          onSave={async (key) => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ openaiApiKey: key }) })}
          onTest={async () => await apiFetch("/api/admin/ai-settings?action=test-openai", { method: "POST" })}
          onClear={async () => await apiFetch("/api/admin/ai-settings", { method: "PUT", body: JSON.stringify({ openaiApiKey: "" }) })}
        />
      </div>

      {/* AI Modules */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon name="sparkles" size={20} className="text-brand-600" />
            AI Modulları
          </h3>
          <button onClick={() => setShowAddModule(!showAddModule)}
            className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 flex items-center gap-1.5">
            <Icon name="plus" size={16} />
            Yeni Modul
          </button>
        </div>

        {/* Add new module form */}
        {showAddModule && (
          <div className="mb-4 p-4 rounded-xl border border-brand-200 bg-brand-50/30">
            <h4 className="font-semibold text-gray-800 text-sm mb-3">Yeni AI Modulu Əlavə Et</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={newModule.id} onChange={e => setNewModule({...newModule, id: e.target.value})}
                placeholder="Modul ID (məs: my-ai-tool)"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              <input value={newModule.name} onChange={e => setNewModule({...newModule, name: e.target.value})}
                placeholder="Modul adı (məs: AI Qiymət Analiz)"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              <input value={newModule.endpoint} onChange={e => setNewModule({...newModule, endpoint: e.target.value})}
                placeholder="API endpoint (məs: /api/ai/my-tool)"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              <select value={newModule.icon} onChange={e => setNewModule({...newModule, icon: e.target.value})}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                <option value="bot">🤖 Robot</option>
                <option value="sparkles">✨ Sparkles</option>
                <option value="trendingUp">📈 Trending</option>
                <option value="sprout">🌱 Sprout</option>
                <option value="zap">⚡ Zap</option>
                <option value="settings">⚙️ Settings</option>
              </select>
            </div>
            <textarea value={newModule.description} onChange={e => setNewModule({...newModule, description: e.target.value})}
              placeholder="Modul təsviri..."
              className="mt-3 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" rows={2} />
            <div className="flex gap-2 mt-3">
              <button onClick={handleAddModule} disabled={saving}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <Icon name="loader" size={14} className="animate-spin" /> : <Icon name="check" size={14} />}
                Əlavə Et
              </button>
              <button onClick={() => setShowAddModule(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200">
                İmtina
              </button>
            </div>
          </div>
        )}

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.modules || []).map((mod) => (
            <div key={mod.id} className={`border rounded-xl p-4 transition-all ${mod.active ? "border-brand-200 bg-white" : "border-gray-200 bg-gray-50 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mod.active ? "bg-brand-50" : "bg-gray-100"}`}>
                  <Icon name={mod.icon || "bot"} size={20} className={mod.active ? "text-brand-600" : "text-gray-400"} />
                </div>
                {/* Toggle switch */}
                <button onClick={() => handleToggleModule(mod.id, mod.active)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${mod.active ? "bg-brand-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${mod.active ? "translate-x-5" : ""}`} />
                </button>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{mod.name}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{mod.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mod.active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                  {mod.active ? "● Aktiv" : "○ Deaktiv"}
                </span>
                <div className="flex items-center gap-2">
                  {mod.page && mod.active && (
                    <a href={mod.page} className="text-xs text-brand-600 hover:underline">Səhifə →</a>
                  )}
                  {mod.isCustom && (
                    <button onClick={() => handleDeleteModule(mod.id)} className="text-xs text-red-500 hover:text-red-700">
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model info */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <Icon name="info" size={14} />
          İstifadə olunan model: <span className="font-mono font-semibold text-gray-700">{data?.model || "gemini-2.5-flash"}</span>
          {" "}• Açar 60 san. keşlənir • Modulların aktiv/deaktiv statusu dərhal tətbiq olunur
        </p>
      </div>

      <ToastContainer />
    </div>
  );
}
