
"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { Link } from "@/i18n/routing";

export default function AIAgronomWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Salam! Mən sizin rəqəmsal AI Aqronomunuzam. Sizə xüsusi təkliflərimiz və aqrar məsləhətlərim var! Necə kömək edə bilərəm? (Məsələn: \"Pomidor yarpaqları saralır, nə edim?\" və ya \"Endirimli gübrələr hansılardır?\")" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  if (pathname?.includes("/admin") || pathname?.includes("/dashboard")) {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const newMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/agronomist-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newMsg] }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "ai", content: data.reply, products: data.products }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", content: `Xəta: ${data.error}` }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", content: "Bağlantı xətası baş verdi." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[100] flex flex-col items-end">
      
      {isOpen && (
        <div className="mb-4 w-[90vw] md:w-[380px] h-[500px] max-h-[70vh] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                <img src="/icons/icon-192.png" alt="FermerMarket" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Aqronom</h3>
                <p className="text-[10px] text-white/80">Sizin kənd təsərrüfatı köməkçiniz</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Icon name="x" size={20} />
            </button>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm"}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                      <p className="text-xs font-bold text-gray-500 mb-2">Tövsiyə olunan məhsullar:</p>
                      {msg.products.map(p => (
                        <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-3 p-2 bg-gray-50 hover:bg-violet-50 rounded-xl transition-colors border border-gray-100">
                          {p.coverImage ? (
                            <img src={p.coverImage} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center"><Icon name="package" size={16} className="text-gray-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-brand-600 font-bold">{p.price} {p.currency || "AZN"}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm p-4 flex gap-2 items-center">
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1 pr-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Sualınızı yazın..."
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-8 h-8 flex items-center justify-center bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                <Icon name="send" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-brand-500 overflow-hidden"
        >
          <img src="/icons/icon-192.png" alt="AI Aqronom" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
          <div className="absolute inset-0 rounded-full border-2 border-brand-500 animate-ping opacity-20"></div>
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
          </div>
        </button>
      )}
    </div>
  );
}

