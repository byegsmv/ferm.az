"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { useRouter } from "next/navigation";
import { clearSiteTextsCache } from "@/lib/siteTexts";

const QUICK_COMMANDS = [
  { label: "📊 Bu günün statistikası", text: "Bu gün neçə istifadəçi, sifariş və məhsul var?" },
  { label: "⚡ Aktiv məhsullar", text: "Neçə aktiv məhsul var?" },
  { label: "💰 Ümumi gəlir", text: "Sistemdəki ümumi gəlir nə qədərdir?" },
  { label: "📦 Gözləyən sifarişlər", text: "PENDING statusunda olan sifarişlər var mı?" },
];

export default function AdminCopilotWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("adminCopilotMessages");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [{
      role: "ai",
      content: "Salam Admin! 👋 Mən Admin Copilot-unuzam.\n\nSistem məlumatlarını öyrənmək, modulları idarə etmək, məhsul/istifadəçi statuslarını dəyişmək üçün Azərbaycan dilində əmr verin.",
    }];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // Persist messages
  useEffect(() => {
    try {
      sessionStorage.setItem("adminCopilotMessages", JSON.stringify(messages.slice(-30)));
    } catch (e) {}
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateLastAI = useCallback((updater) => {
    setMessages(prev => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      if (copy[lastIdx]?.role === "ai") {
        copy[lastIdx] = { ...copy[lastIdx], ...updater(copy[lastIdx]) };
      }
      return copy;
    });
  }, []);

  const executeCode = async (code, msgIdx) => {
    setMessages(prev => {
      const copy = [...prev];
      if (copy[msgIdx]) copy[msgIdx] = { ...copy[msgIdx], isExecuting: true };
      return copy;
    });

    try {
      const res = await fetch("/api/admin/copilot-chat/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      setMessages(prev => {
        const copy = [...prev];
        if (copy[msgIdx]) {
          copy[msgIdx] = { ...copy[msgIdx], isExecuting: false, executed: true };
        }
        return copy;
      });

      if (res.ok) {
        clearSiteTextsCache?.();
        addMessage({ role: "ai", content: `✅ Əməliyyat uğurla icra edildi!${data.result ? "\n\nNəticə: " + JSON.stringify(data.result, null, 2) : ""}` });
        setTimeout(() => router.refresh(), 500);
      } else {
        addMessage({ role: "ai", content: `❌ İcra xətası:\n${data.error || "Naməlum xəta"}` });
      }
    } catch (e) {
      setMessages(prev => {
        const copy = [...prev];
        if (copy[msgIdx]) copy[msgIdx] = { ...copy[msgIdx], isExecuting: false, executed: true };
        return copy;
      });
      addMessage({ role: "ai", content: "❌ Bağlantı xətası baş verdi." });
    }
  };

  const handleSend = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    addMessage({ role: "user", content: userText });
    setInput("");
    setLoading(true);

    // Add a placeholder AI message
    const aiPlaceholderIdx = messages.length + 1;

    try {
      const res = await fetch("/api/admin/copilot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: userText }] }),
      });
      const data = await res.json();

      if (res.ok) {
        let aiText = data.reply || "";
        let mutationAction = null;

        const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.intent === "DB_MUTATION") {
              mutationAction = parsed;
              aiText = aiText.replace(/```json\n[\s\S]*?\n```/, "").trim();
            }
          } catch (e) {}
        }

        const newMsgIdx = messages.length + 1; // user msg is at messages.length, ai is at +1

        setMessages(prev => {
          const aiMsg = {
            role: "ai",
            content: aiText,
            dataView: data.dataView,
            mutationAction: mutationAction || null,
            executed: false,
            isExecuting: false,
          };
          return [...prev, aiMsg];
        });

        // Auto execute if no confirmation needed
        if (mutationAction && mutationAction.requires_confirmation === false) {
          setTimeout(() => {
            setMessages(prev => {
              const idx = prev.findIndex((m, i) => i === prev.length - 1 && m.role === "ai" && m.mutationAction);
              if (idx !== -1) executeCode(mutationAction.prismaCode, idx);
              return prev;
            });
          }, 300);
        }
      } else {
        addMessage({ role: "ai", content: `❌ Xəta: ${data.error || "Cavab alınmadı"}` });
      }
    } catch (e) {
      addMessage({ role: "ai", content: "❌ Bağlantı xətası baş verdi." });
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "ai",
      content: "Söhbət silindi. Yeni sualınızı yazın!",
    }]);
    sessionStorage.removeItem("adminCopilotMessages");
  };

  const panelWidth = isExpanded ? "w-[520px]" : "w-[380px]";
  const panelHeight = isExpanded ? "h-[80vh]" : "h-[560px]";

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3">

      {/* Chat Panel */}
      {isOpen && (
        <div className={`${panelWidth} ${panelHeight} max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col`}
          style={{ transition: "width 0.2s, height 0.2s" }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <Icon name="sparkles" size={14} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">Admin Copilot</p>
                <p className="text-[10px] text-gray-400 leading-tight">Sistem analizi & avtomatlaşdırma</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsExpanded(v => !v)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title={isExpanded ? "Kiçilt" : "Böyüt"}>
                <Icon name={isExpanded ? "minimize2" : "maximize2"} size={14} />
              </button>
              <button onClick={clearChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Söhbəti sil">
                <Icon name="trash2" size={14} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Icon name="x" size={16} />
              </button>
            </div>
          </div>

          {/* Quick Commands */}
          <div className="px-3 py-2 border-b border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-gray-50/50">
            {QUICK_COMMANDS.map((cmd, i) => (
              <button key={i} onClick={() => handleSend(cmd.text)}
                className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:border-brand-400 hover:text-brand-600 transition-all shrink-0">
                {cmd.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div ref={chatRef} data-lenis-prevent="true"
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 min-h-0">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "ai" && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 mr-2 mt-1">
                    <Icon name="sparkles" size={12} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-brand-600 text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                }`}>
                  {msg.content && (
                    <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{msg.content}</p>
                  )}

                  {/* Mutation confirm block */}
                  {msg.mutationAction && !msg.executed && (
                    <div className="mt-2.5 border border-amber-200 bg-amber-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs mb-1.5">
                        <Icon name="alertTriangle" size={14} /> Təsdiq Tələb Olunur
                      </div>
                      {msg.mutationAction.warning && (
                        <p className="text-[12px] text-amber-800 mb-2.5 leading-relaxed">{msg.mutationAction.warning}</p>
                      )}
                      <div className="bg-gray-900 rounded-lg px-2.5 py-1.5 mb-2.5 font-mono text-[10px] text-emerald-400 overflow-x-auto">
                        {msg.mutationAction.prismaCode}
                      </div>
                      <button
                        onClick={() => executeCode(msg.mutationAction.prismaCode, idx)}
                        disabled={msg.isExecuting}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
                      >
                        {msg.isExecuting ? (
                          <><Icon name="loader" size={12} className="animate-spin" /> İcra olunur...</>
                        ) : (
                          <><Icon name="check" size={12} /> Təsdiqlə & İcra Et</>
                        )}
                      </button>
                    </div>
                  )}

                  {msg.executed && !msg.mutationAction?.requires_confirmation && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                      <Icon name="checkCircle" size={12} /> Uğurla icra edildi
                    </div>
                  )}

                  {/* Data view */}
                  {msg.dataView && (
                    <div className="mt-2 p-2 bg-gray-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-40">
                      <pre>{JSON.stringify(msg.dataView, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-center gap-2 ml-8">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5 focus-within:border-brand-400 transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Admin əmrini yazın... (Enter göndər, Shift+Enter yeni sətir)"
                className="flex-1 bg-transparent px-2 py-1 text-sm outline-none resize-none leading-relaxed min-h-[32px] max-h-[100px]"
                style={{ overflow: "hidden" }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-40 transition-all active:scale-95 shrink-0"
              >
                <Icon name="arrowRight" size={15} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 px-1">Enter ilə göndər · Shift+Enter yeni sətir</p>
          </div>
        </div>
      )}

      {/* Toggle FAB */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 ${
          isOpen
            ? "bg-gray-800 hover:bg-gray-900 rotate-0"
            : "bg-gradient-to-br from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800"
        }`}
      >
        <Icon name={isOpen ? "x" : "sparkles"} size={22} className="text-white" />
      </button>
    </div>
  );
}
