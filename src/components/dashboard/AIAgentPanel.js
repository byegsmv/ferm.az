"use client";

import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

const QUICK_COMMANDS = [
  { icon: "plus", label: "Yeni Səhifə Yarat", command: "Yeni 'Haqqımızda' səhifəsi yarat, AZ/EN/RU dillərində mətn sahələri olsun, admin panel-də redaktə olunsun" },
  { icon: "edit", label: "Mətn Dəyişdir", command: "Bütün 'Məhsul' sözünü 'Elan' ilə əvəz et, həm frontend, həm admin panel-də" },
  { icon: "tag", label: "Yeni Kupon", command: "Yeni kupon sistemi əlavə et: faiz endirimi, sabit məbləğ, min sifariş, max istifadə, start/expiry tarixləri" },
  { icon: "grid", label: "Yeni Kateqoriya", command: "Yeni 'Balıqçılıq' kateqoriyası əlavə et, icon ilə, products səhifəsində filter olsun" },
  { icon: "star", label: "Yeni Bölmə", command: "Ana səhifəyə 'Müştəri Rəyləri' bölməsi əlavə et, slider formatında, 5 review göstər" },
  { icon: "archive", label: "Arxivlə", command: "Köhnə campaign-ləri arxivlə, status-u ARCHIVED olsun, admin-də ayrıca tab olsun" },
  { icon: "sync", label: "Translation Sync", command: "sync-discovery", type: "action" },
];

export default function AIAgentPanel() {
  const { toast, ToastContainer } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("plan"); // plan | dry-run | apply
  const [lastResult, setLastResult] = useState(null);
  const [diffPreview, setDiffPreview] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendCommand(commandText, isQuickCommand = false) {
    const cmd = commandText.trim();
    if (!cmd && !isQuickCommand) return;

    setMessages(prev => [...prev, { role: "user", content: cmd, timestamp: new Date() }]);
    setInput("");
    setLoading(true);
    setDiffPreview(null);

    try {
      // Check if it's a special action
      if (cmd === "sync-discovery") {
        const result = await apiFetch("/api/admin/ai-agent?action=sync-discovery", {
          method: "POST",
          body: JSON.stringify({ command: "sync-discovery", mode: "apply" }),
        });
        setMessages(prev => [...prev, {
          role: "ai",
          content: `🔍 Auto-Discovery Nəticəsi:\n\n• Tapıldı: ${result.totalScanned} açar\n• Eksik: ${result.missing}\n• Yaradıldı: ${result.created}\n• Yeniləndi: ${result.updated}`,
          data: result,
          timestamp: new Date(),
        }]);
        setLoading(false);
        return;
      }

      const result = await apiFetch("/api/admin/ai-agent", {
        method: "POST",
        body: JSON.stringify({ command: cmd, mode }),
      });

      if (result.error) {
        let errorMsg = `❌ Xəta: ${result.error}`;
        if (result.errors && result.errors.length > 0) {
          errorMsg += `\n\nValidation xətaları:\n${result.errors.map(e => `• ${e.error || e}`).join('\n')}`;
        }
        if (result.warnings && result.warnings.length > 0) {
          errorMsg += `\n\nXəbərdarlıqlar:\n${result.warnings.map(w => `• ${w}`).join('\n')}`;
        }
        if (result.applyResults) {
          errorMsg += `\n\nNəticələr:\n${result.applyResults.map(r => `• ${r.path}: ${r.action}${r.error ? ` — ❌ ${r.error}` : ' ✅'}`).join('\n')}`;
        }
        if (!process.env.NEXT_PUBLIC_GEMINI_KEY && result.warnings?.some(w => w.includes("GEMINI"))) {
          errorMsg += `\n\n💡 GEMINI_API_KEY əlavə etmək üçün .env faylını redaktə et:\nGEMINI_API_KEY=sizin_api_acariniz`;
        }
        setMessages(prev => [...prev, {
          role: "error",
          content: errorMsg,
          timestamp: new Date(),
        }]);
        setLoading(false);
        return;
      }

      // Plan mode
      if (result.plan && !result.files) {
        setMessages(prev => [...prev, {
          role: "ai",
          content: result.plan,
          timestamp: new Date(),
        }]);
      }

      // Dry-run or Apply
      if (result.files && result.files.length > 0) {
        let summary = `📋 ${result.files.length} fayl dəyişdiriləcək:\n\n`;
        for (const f of result.files) {
          const icon = f.action === "create" ? "➕" : f.action === "delete" ? "🗑️" : "✏️";
          summary += `${icon} **${f.action.toUpperCase()}**: \`${f.path}\`\n`;
          if (f.reason) summary += `   _${f.reason}_\n`;
        }

        if (result.warnings?.length > 0) {
          summary += `\n⚠️ Xəbərdarlıqlar:\n`;
          for (const w of result.warnings) {
            summary += `- ${w}\n`;
          }
        }

        if (result.missingKeys?.length > 0) {
          summary += `\n🔑 ${result.missingKeys.length} yeni translation key yaradılacaq\n`;
        }

        if (result.applyResults) {
          summary = `✅ ${result.applyResults.filter(r => !r.error).length} fayl uğurla dəyişdirildi\n\n`;
          for (const r of result.applyResults) {
            const icon = r.error ? "❌" : "✅";
            summary += `${icon} \`${r.path}\` — ${r.action}${r.size ? ` (${r.size} byte)` : ""}${r.error ? `: ${r.error}` : ""}\n`;
          }
        }

        setMessages(prev => [...prev, {
          role: "ai",
          content: summary,
          data: result,
          timestamp: new Date(),
        }]);

        // Show diff preview for dry-run
        if (mode === "dry-run" && !result.applyResults) {
          setDiffPreview(result.files);
        }
      }

      setLastResult(result);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "error",
        content: `❌ Bağlantı xətası: ${err.message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!lastResult?.files) return;
    sendCommand("tətbiq et", true); // Re-send with apply mode
    setMode("apply");
  }

  return (
    <div className="space-y-4">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Icon name="bot" size={20} /> AI Full-Stack Agent
          </h2>
          <p className="text-sm text-gray-500">Natural dil ilə əmr ver, AI kod yazsın</p>
        </div>
        <div className="flex gap-2">
          {["plan", "dry-run", "apply"].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                mode === m ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {m === "plan" ? "📋 Plan" : m === "dry-run" ? "🔍 Dry-Run" : "✅ Apply"}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_COMMANDS.map((qc, i) => (
          <button
            key={i}
            onClick={() => sendCommand(qc.command, true)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1.5 transition"
          >
            <Icon name={qc.icon} size={14} /> {qc.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div ref={chatRef} className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Icon name="bot" size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">AI Agent-a əmr verin</p>
            <p className="text-sm mt-1">Məsələn: "Yeni blog səhifəsi yarat"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-2xl p-3 ${
              msg.role === "user"
                ? "bg-brand-600 text-white ml-12"
                : msg.role === "error"
                ? "bg-red-50 text-red-700 border border-red-200 mr-12"
                : "bg-white border border-gray-200 mr-12"
            }`}
          >
            <pre className="whitespace-pre-wrap text-sm font-sans">{msg.content}</pre>
            <p className="text-[10px] opacity-60 mt-2">
              {msg.timestamp.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}

        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-3 mr-12">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin"><Icon name="loader" size={16} /></div>
              <span className="text-sm">AI düşünür...</span>
            </div>
          </div>
        )}
      </div>

      {/* Diff Preview */}
      {diffPreview && diffPreview.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Icon name="fileText" size={16} /> Dəyişiklik Preview
          </h3>
          <div className="space-y-2">
            {diffPreview.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs font-mono">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold ${f.action === "create" ? "text-green-600" : f.action === "delete" ? "text-red-600" : "text-blue-600"}`}>
                    {f.action.toUpperCase()}
                  </span>
                  <span className="text-gray-500">{f.path}</span>
                </div>
                {f.content && (
                  <pre className="bg-gray-100 rounded p-2 overflow-x-auto max-h-40 text-[10px] leading-relaxed">
                    {f.content.slice(0, 500)}{f.content.length > 500 ? "\n..." : ""}
                  </pre>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleApply}
            className="mt-3 btn-primary w-full flex items-center justify-center gap-2"
          >
            <Icon name="check" size={16} /> Bu Dəyişiklikləri Tətbiq Et
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendCommand(input);
            }
          }}
          placeholder="AI-a əmr verin... (məs: 'Yeni kateqoriya əlavə et')"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
          disabled={loading}
        />
        <button
          onClick={() => sendCommand(input)}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Icon name="send" size={18} /> Göndər
        </button>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 text-center">
        <p>AI-generated kod tətbiq edilməzdən əvvəl validatе edilir. Xəta olarsa avtomatik rollback olunur.</p>
        <p>Mod: <strong>{mode}</strong> — {mode === "plan" ? "Sadəcə plan göstərir" : mode === "dry-run" ? "Kod generatе edir, fayla yazmır" : "Kod generatе edir və fayllara yazır"}</p>
      </div>
    </div>
  );
}
