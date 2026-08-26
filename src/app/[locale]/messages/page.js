"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { apiFetch, getUser } from "@/lib/apiClient";
import { Link } from "@/i18n/routing";
import useSWR from "swr";
import Icon from "@/components/ui/Icon";
import SafeImage from "@/components/SafeImage";

const fetcher = (url) => apiFetch(url);

function timeAgo(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "indi";
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat`;
  return d.toLocaleDateString("az-AZ");
}

function MessagesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("id");

  const [me, setMe] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auth check
  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setMe(u);
  }, []);

  // Fetch conversations with SWR (poll every 10s)
  const { data: convData, mutate: mutateConvs } = useSWR(
    me ? "/api/conversations" : null,
    fetcher,
    { refreshInterval: 10000 }
  );
  const conversations = convData?.conversations || [];

  // Auto-select conversation from URL param
  useEffect(() => {
    if (activeId && conversations.length > 0 && !activeConv) {
      const conv = conversations.find(c => c.id === activeId);
      if (conv) setActiveConv(conv);
    }
  }, [activeId, conversations, activeConv]);

  // Fetch active conversation messages with SWR (poll every 3s if active)
  const { data: msgData, mutate: mutateMsgs } = useSWR(
    activeConv ? `/api/conversations/${activeConv.id}/messages` : null,
    fetcher,
    { refreshInterval: 3000 }
  );
  
  // Optimistic messages state (so UI updates instantly before SWR revalidates)
  const [optimisticMessages, setOptimisticMessages] = useState([]);

  // When SWR gets new real messages, clear our optimistic ones and clear unread badge for this conv
  useEffect(() => {
    if (msgData?.messages) {
      setOptimisticMessages([]);
      // If we just fetched new messages for the active conv, tell SWR to update the conv list to clear unread counts
      mutateConvs((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          conversations: prev.conversations.map(c => 
            c.id === activeConv.id ? { ...c, _unread: 0 } : c
          )
        };
      }, false);
      
      // Auto-scroll on new messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [msgData, mutateConvs, activeConv]);

  const allMessages = [...(msgData?.messages || []), ...optimisticMessages];

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    
    setSending(true);
    const content = text.trim();
    setText("");
    
    // Add optimistic message
    const tempId = `tmp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      content,
      senderId: me?.id || me?.sub,
      sender: { fullName: "Siz" },
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    
    // Auto scroll down
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      await apiFetch(`/api/conversations/${activeConv.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      // Force SWR to fetch real data immediately
      await mutateMsgs();
      mutateConvs(); // Update last message preview
    } catch {
      // Revert optimistic on fail
      setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
      setText(content);
      alert("Mesaj göndərilmədi.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const myId = me?.id || me?.sub;

  function getOtherParty(conv) {
    if (!myId) return null;
    if (conv.buyerId === myId) return conv.seller;
    return conv.buyer;
  }

  // Handle Mobile back button inside chat
  function closeChat() {
    setActiveConv(null);
    router.replace("/messages");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 h-[85vh] md:h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-black text-gray-900"> Mesajlar</h1>
      </div>

      <div className="flex flex-1 gap-0 border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-md relative">
        
        {/* LEFT PANEL: Conversation List */}
        <div className={`flex flex-col border-r border-gray-200 bg-gray-50/50 ${activeConv ? "hidden md:flex" : "flex w-full"} md:w-80 lg:w-[350px] flex-shrink-0 transition-all`}>
          <div className="p-4 border-b border-gray-200 bg-white z-10 shadow-sm">
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                 <Icon name="search" size={16} />
               </div>
               <input 
                 type="text" 
                 placeholder="Söhbət axtar..." 
                 className="w-full bg-gray-100 border-none rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
               />
             </div>
          </div>

          {!convData ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm gap-2">
              <Icon name="loader" size={18} className="animate-spin" /> Yüklənir...
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <Icon name="message" size={30} />
              </div>
              <p className="text-gray-900 font-bold">Hələ söhbət yoxdur</p>
              <p className="text-gray-500 text-xs max-w-[200px]">Elanlardan satıcılarla əlaqə saxlayaraq söhbətə başlayın.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
              {conversations.map(conv => {
                const other = getOtherParty(conv);
                const lastMsg = conv.messages?.[0];
                const isActive = activeConv?.id === conv.id;
                const initial = other?.fullName?.charAt(0)?.toUpperCase() || "?";
                const unreadCount = conv._unread || 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => { setActiveConv(conv); router.push(`/messages?id=${conv.id}`); }}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-gray-100 transition-colors ${
                      isActive ? "bg-brand-50 border-l-4 border-l-brand-600" : "hover:bg-gray-100 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm ${
                        isActive ? "bg-brand-600 text-white" : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700"
                      }`}>
                        {initial}
                      </div>
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className={`font-bold text-sm truncate ${unreadCount > 0 ? "text-black" : "text-gray-900"}`}>
                          {other?.fullName || "İstifadəçi"}
                        </p>
                        <p className={`text-[11px] flex-shrink-0 font-medium ${unreadCount > 0 ? "text-brand-600" : "text-gray-400"}`}>
                          {lastMsg ? timeAgo(lastMsg.createdAt) : ""}
                        </p>
                      </div>
                      
                      {conv.product && (
                        <p className="text-[11px] text-brand-700 font-semibold truncate mb-0.5 flex items-center gap-1">
                           <Icon name="shoppingBag" size={12} /> {conv.product.titleAz}
                        </p>
                      )}
                      
                      {lastMsg && (
                        <div className="flex items-center gap-1">
                          {lastMsg.senderId === myId && (
                            <span className="text-[10px] text-gray-400">
                              {lastMsg.readAt ? <Icon name="checkCheck" size={14} className="text-blue-500 inline" /> : <Icon name="check" size={14} className="inline" />}
                            </span>
                          )}
                          <p className={`text-xs truncate ${unreadCount > 0 ? "font-bold text-gray-800" : "text-gray-500"}`}>
                            {lastMsg.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Chat Window */}
        <div className={`flex flex-col flex-1 min-w-0 bg-[#f4f7f6] relative ${!activeConv ? "hidden md:flex" : "flex w-full"}`}>
          
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-gray-50/50">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center text-brand-500 mb-2">
                 <Icon name="message" size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">FermerMarket Mesajlar</h3>
                <p className="text-gray-500 text-sm">Söhbətə başlamaq üçün sol tərəfdən bir istifadəçi seçin.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 z-10 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={closeChat}
                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <Icon name="arrowLeft" size={20} />
                  </button>
                  
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center font-bold text-brand-800 text-sm flex-shrink-0 shadow-inner">
                    {getOtherParty(activeConv)?.fullName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  
                  <div className="flex flex-col">
                    <p className="font-bold text-gray-900 text-[15px] leading-tight">
                      {getOtherParty(activeConv)?.fullName || "İstifadəçi"}
                    </p>
                    <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> Aktiv
                    </p>
                  </div>
                </div>
                
                {/* Product Context in Header */}
                {activeConv.product && (
                  <Link 
                    href={`/products/${activeConv.product.slug}`} 
                    className="hidden sm:flex items-center gap-2 bg-gray-50 hover:bg-brand-50 border border-gray-200 hover:border-brand-200 px-3 py-1.5 rounded-xl transition max-w-[200px]"
                  >
                     <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-sm text-lg shrink-0">
                       </div>
                     <div className="flex flex-col min-w-0">
                       <span className="text-[10px] text-gray-500 font-medium">Elan</span>
                       <span className="text-xs text-brand-700 font-bold truncate block">{activeConv.product.titleAz}</span>
                     </div>
                  </Link>
                )}
              </div>

              {/* Chat Messages Area */}
              {/* Custom background pattern to make it look premium (like WhatsApp) */}
              <div className="absolute inset-0 bg-cover bg-center opacity-[0.03] pointer-events-none z-0" 
                   style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cartographer.png')"}}>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 relative z-10 scroll-smooth">
                {!msgData && optimisticMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full gap-2 text-brand-600 font-semibold text-sm">
                    <Icon name="loader" size={18} className="animate-spin" /> Yüklənir...
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="bg-white p-4 rounded-full shadow-sm text-brand-500">
                      <Icon name="hand" size={32} />
                    </div>
                    <p className="text-gray-500 text-sm font-medium bg-white/80 px-4 py-1.5 rounded-full shadow-sm">
                      İlk mesajı göndərərək söhbəti başladın
                    </p>
                  </div>
                ) : (
                  allMessages.map((msg, i) => {
                    const isMe = msg.senderId === myId;
                    const showTail = i === allMessages.length - 1 || allMessages[i + 1]?.senderId !== msg.senderId;
                    
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
                        <div className={`relative max-w-[85%] md:max-w-md px-4 py-2 text-[14px] leading-relaxed shadow-sm flex flex-col ${
                          isMe
                            ? "bg-brand-600 text-white" 
                            : "bg-white text-gray-800 border border-gray-100"
                        } ${msg._optimistic ? "opacity-70" : ""} ${
                          isMe 
                            ? (showTail ? "rounded-2xl rounded-br-sm" : "rounded-2xl") 
                            : (showTail ? "rounded-2xl rounded-bl-sm" : "rounded-2xl")
                        }`}>
                          
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          
                          <div className={`flex items-center justify-end gap-1 mt-1 shrink-0 ${isMe ? "text-brand-200" : "text-gray-400"}`}>
                            <span className="text-[10px] font-medium">{new Date(msg.createdAt).toLocaleTimeString("az-AZ", {hour: '2-digit', minute:'2-digit'})}</span>
                            {isMe && !msg._optimistic && (
                              <span className={`text-[10px] ml-0.5 ${msg.readAt ? "text-blue-300" : ""}`}>
                                {msg.readAt ? <Icon name="checkCheck" size={14} className="text-blue-500 inline" /> : <Icon name="check" size={14} className="inline" />}
                              </span>
                            )}
                            {msg._optimistic && <Icon name="clock" size={10} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Chat Input Area */}
              <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-200 z-10 shrink-0">
                <form onSubmit={sendMessage} className="flex gap-2 items-end max-w-4xl mx-auto">
                  <div className="flex-1 bg-white border border-gray-300 rounded-3xl flex items-center shadow-sm px-2 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all overflow-hidden">
                    <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition">
                      <Icon name="smile" size={20} />
                    </button>
                    <textarea
                      ref={inputRef}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => { 
                        if (e.key === "Enter" && !e.shiftKey) { 
                          e.preventDefault(); 
                          sendMessage(e); 
                        } 
                      }}
                      placeholder="Mesaj yazın..."
                      className="flex-1 bg-transparent py-3 px-2 text-sm focus:outline-none max-h-32 resize-none no-scrollbar"
                      rows={1}
                      disabled={sending}
                      style={{ minHeight: "44px" }}
                    />
                    <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition">
                      <Icon name="paperclip" size={20} />
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-md disabled:opacity-50 disabled:hover:bg-brand-600 transition-all shrink-0"
                  >
                    <Icon name="send" size={18} className="ml-1" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh] text-gray-400"><Icon name="loader" size={24} className="animate-spin mr-2"/> Yüklənir...</div>}>
      <MessagesInner />
    </Suspense>
  );
}
