
"use client";
import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";

export default function AdminCopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Salam Admin! Mən sizin AI köməkçinizəm. Sistemdəki məlumatları öyrənmək üçün mənə sual verin (Məs: \"Bu gün neçə sifariş var?\"). Və ya modul idarəetməsi (məs: \"E-poçt modulunu deaktiv et\") əmrləri verə bilərsiniz." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const newMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/copilot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newMsg] }),
      });
      const data = await res.json();
      
      if (res.ok) {
        let aiText = data.reply;
        let mutationAction = null;

        // Təhlükəli əməliyyat JSON-u olub-olmadığını yoxla
        const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.intent === "DB_MUTATION") {
              mutationAction = parsed;
              aiText = aiText.replace(/```json\n[\s\S]*?\n```/, "").trim();
            }
          } catch (e) { console.error("JSON parse error:", e); }
        }

        setMessages((prev) => [...prev, { 
          role: "ai", 
          content: aiText, 
          dataView: data.dataView,
          mutationAction 
        }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", content: `Xəta: ${data.error}` }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", content: "Bağlantı xətası baş verdi." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (idx, code) => {
    // İşarələ ki yüklənir
    setMessages((prev) => {
      const copy = [...prev];
      copy[idx].isExecuting = true;
      return copy;
    });

    try {
      const res = await fetch("/api/admin/copilot-chat/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      
      setMessages((prev) => {
        const copy = [...prev];
        copy[idx].isExecuting = false;
        copy[idx].executed = true;
        return copy;
      });

      if (res.ok) {
        setMessages((prev) => [...prev, { role: "ai", content: "✅ Əməliyyat uğurla icra olundu!\n" + (data.result ? JSON.stringify(data.result) : "") }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", content: `❌ İcra xətası: ${data.error}` }]);
      }
    } catch(e) {
      setMessages((prev) => [...prev, { role: "ai", content: "Bağlantı xətası baş verdi." }]);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      {isOpen && (
        <div className="mb-4 w-[350px] h-[550px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gray-900 p-4 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Icon name="terminal" size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Admin Copilot</h3>
                <p className="text-[10px] text-gray-400">Sistem analizi və avtomatlaşdırma</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <Icon name="x" size={18} />
            </button>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-xl p-3 text-sm ${msg.role === "user" ? "bg-brand-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 shadow-sm rounded-bl-sm"}`}>
                  {msg.content && <p className="whitespace-pre-wrap leading-relaxed mb-2">{msg.content}</p>}
                  
                  {msg.mutationAction && !msg.executed && (
                    <div className="mt-2 border border-red-200 bg-red-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
                        <Icon name="alert-triangle" size={16} /> DİQQƏT
                      </div>
                      <p className="text-xs text-red-800 mb-3">{msg.mutationAction.warning}</p>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleExecute(idx, msg.mutationAction.prismaCode)}
                          disabled={msg.isExecuting}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                          {msg.isExecuting ? "İcra olunur..." : "Təsdiqlə və İcra Et"}
                        </button>
                      </div>
                    </div>
                  )}
                  {msg.executed && (
                    <div className="mt-2 text-xs text-green-600 font-medium">Əməliyyat icra edildi.</div>
                  )}

                  {msg.dataView && !msg.mutationAction && (
                    <div className="mt-2 p-2 bg-gray-900 text-green-400 font-mono text-[10px] rounded-lg overflow-x-auto">
                      <pre>{JSON.stringify(msg.dataView, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl rounded-bl-sm p-4 flex gap-2 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 pr-1">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Admin əmrini yazın..."
                className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <Icon name="terminal" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 bg-gray-900 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <Icon name="terminal" size={24} className="text-white" />
          <div className="absolute inset-0 rounded-full border border-brand-500 animate-ping opacity-30"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-brand-500 rounded-full"></div>
          </div>
        </button>
      )}
    </div>
  );
}

