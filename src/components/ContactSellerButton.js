"use client";
import { useState } from "react";
import { apiFetch, getUser } from "@/lib/apiClient";
import { useRouter } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";

export default function ContactSellerButton({ sellerId, productId, productTitle }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(`Salam, "${(productTitle || "elan").slice(0,30)}" haqqında məlumat almaq istəyirəm.`);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const user = getUser();

  if (!user || user.id === sellerId) return null;

  async function send(e) {
    e.preventDefault();
    if (!msg.trim()) return;
    setSending(true);
    try {
      await apiFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ sellerId, productId: productId || undefined, content: msg.trim() }),
      });
      setDone(true);
      // Navigate to the messages page after a short delay
      setTimeout(() => {
        setOpen(false);
        router.push("/messages");
      }, 1200);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-brand-600 text-brand-700 font-semibold rounded-2xl py-3 hover:bg-brand-50 transition-colors"
      >
        <Icon name="message" size={17} /> Satıcıya mesaj göndər
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6">
            {done ? (
              <div className="text-center py-4">
                <Icon name="checkCircle" size={40} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-bold">Mesajınız göndərildi!</p>
                <p className="text-sm text-gray-500 mt-1 mb-3">Satıcı cavab verincə bildiriş alacaqsınız.</p>
                <a href="/messages" className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-brand-700 transition">
                  <Icon name="message" size={16} /> Mesajlara keç
                </a>
              </div>
            ) : (
              <form onSubmit={send} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold inline-flex items-center gap-2"><Icon name="message" size={17} /> Satıcıya mesaj</p>
                  <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl" aria-label="Bağla"><Icon name="close" size={18} /></button>
                </div>
                <textarea
                  rows={3}
                  className="input-field"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                />
                <button type="submit" disabled={sending || !msg.trim()} className="btn-primary w-full">
                  {sending ? "Göndərilir..." : <><Icon name="send" size={16} /> Mesaj göndər</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
