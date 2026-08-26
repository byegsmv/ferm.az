"use client";
import Icon from "@/components/ui/Icon";
import { useEffect, useRef, useState, useCallback } from "react";
import { apiFetch, getUser } from "@/lib/apiClient";

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
}
function formatDay(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today - d) / 86400000);
  if (diff === 0) return "Bu gün";
  if (diff === 1) return "Dünən";
  return d.toLocaleDateString("az-AZ");
}

function ChatWindow({ conversationId, user, otherName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const load = useCallback(() => {
    apiFetch(`/api/conversations/${conversationId}/messages`)
      .then((d) => {
        setMessages(d.messages || []);
      })
      .catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 5000); // polling every 5s
    return () => clearInterval(pollRef.current);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const optimistic = { id: "tmp-" + Date.now(), senderId: user.id, content: text.trim(), createdAt: new Date().toISOString(), sender: { fullName: user.name } };
    setMessages((prev) => [...prev, optimistic]);
    const t = text.trim();
    setText("");
    try {
      await apiFetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: t }),
      });
      load();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(t);
    } finally {
      setSending(false);
    }
  }

  let lastDay = "";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
        <button onClick={onBack} className="btn-icon"><Icon name="arrowLeft" size={18} /></button>
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
          {(otherName || "?")[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm">{otherName}</p>
          <p className="text-[11px] text-gray-400">5 saniyədə yenilənir</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">Hələ mesaj yoxdur. Söhbəti başladın!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user.id;
          const day = formatDay(msg.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={msg.id}>
              {showDay && (
                <div className="text-center my-3">
                  <span className="text-[11px] text-gray-400 bg-gray-200 px-3 py-1 rounded-full">{day}</span>
                </div>
              )}
              <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                  isMe
                    ? "bg-brand-600 text-white rounded-br-sm"
                    : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-brand-200" : "text-gray-400"} text-right`}>
                    {formatTime(msg.createdAt)}
                    {isMe && msg.readAt && <Icon name="checkCheck" size={14} className="text-blue-500 inline ml-1" />}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white">
        <input
          className="flex-1 input-field"
          placeholder="Mesaj yazın..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand-700 transition-colors flex-shrink-0"
        >
          <Icon name="send" size={16} />
        </button>
      </form>
    </div>
  );
}

export default function MessagingPanel() {
  const [user] = useState(() => getUser());
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);

  useEffect(() => {
    apiFetch("/api/conversations")
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return <p className="text-sm text-gray-400 p-4">Mesajlaşmaq üçün daxil olun.</p>;

  if (activeConv) {
    const conv = conversations.find((c) => c.id === activeConv);
    const other = conv?.buyerId === user.id ? conv?.seller : conv?.buyer;
    return (
      <div className="h-[520px] flex flex-col border border-gray-100 rounded-2xl overflow-hidden">
        <ChatWindow
          conversationId={activeConv}
          user={user}
          otherName={other?.fullName || "İstifadəçi"}
          onBack={() => setActiveConv(null)}
        />
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Mesajlarım</h2>
        <span className="badge-blue text-[11px] px-2 py-0.5 rounded-full">{conversations.length}</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-10">
          <Icon name="message" size={48} className="text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Hələ heç bir söhbətiniz yoxdur.</p>
          <p className="text-gray-400 text-xs mt-1">Bir elanın səhifəsinə gedib "Mesaj göndər" düyməsini sınayın.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const other = conv.buyerId === user.id ? conv.seller : conv.buyer;
            const lastMsg = conv.messages?.[0];
            const isUnread = lastMsg && lastMsg.senderId !== user.id && !lastMsg.readAt;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left border border-transparent hover:border-gray-100"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isUnread ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {(other?.fullName || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                      {other?.fullName || "İstifadəçi"}
                    </p>
                    <p className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{lastMsg ? formatTime(lastMsg.createdAt) : ""}</p>
                  </div>
                  {conv.product && <p className="text-[11px] text-brand-600 truncate">{conv.product.titleAz}</p>}
                  {lastMsg && (
                    <p className={`text-xs truncate mt-0.5 ${isUnread ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                      {lastMsg.senderId === user.id ? "Siz: " : ""}{lastMsg.content}
                    </p>
                  )}
                </div>
                {isUnread && <div className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
