"use client";
import { useState } from "react";
import { apiFetch, getUser } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";

export default function QuoteRequestModal({ sellerId, productId, productTitle, minOrderQty }) {
  const user = getUser();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    company: "",
    quantity: minOrderQty || "",
    message: `Salam, "${(productTitle || "elan").slice(0, 30)}" məhsulu üçün toplu sifariş/kotirovka şərtləri ilə maraqlanıram.`
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function send(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim() || !formData.quantity) return;
    
    setSending(true);
    try {
      await apiFetch("/api/b2b-quote", {
        method: "POST",
        body: JSON.stringify({ 
          sellerId, 
          productId, 
          ...formData 
        }),
      });
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 2000);
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
        className="btn-primary"
      >
        <Icon name="message" size={17} /> Kotirovka Soruş
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6">
            {done ? (
              <div className="text-center py-4">
                <Icon name="checkCircle" size={40} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-bold">Sorgunuz göndərildi!</p>
                <p className="text-sm text-gray-500 mt-1 mb-3">Satıcı tezliklə sizinlə əlaqə saxlayacaq.</p>
              </div>
            ) : (
              <form onSubmit={send} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold inline-flex items-center gap-2">
                    <Icon name="document" size={17} /> Kotirovka Tələbi
                  </p>
                  <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl" aria-label="Bağla">
                    <Icon name="close" size={18} />
                  </button>
                </div>
                <div className="bg-purple-50 text-purple-800 p-3 rounded-lg text-sm mb-2">
                  Toplu sifarişlər üçün xüsusi qiymət təklifi (kotirovka) əldə edin.
                </div>
                <input
                  type="text"
                  className="input-field w-full mb-3"
                  placeholder="Adınız"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  className="input-field w-full mb-3"
                  placeholder="Şirkət / Təsərrüfat (İstəyə bağlı)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
                <input
                  type="number"
                  className="input-field w-full mb-3"
                  placeholder="Miqdar"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
                <textarea
                  rows={4}
                  className="input-field w-full mb-3"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Məsələn: 100 ədəd alaram, qiymət necə olar?"
                  required
                />
                <button type="submit" disabled={sending} className="btn-primary w-full">
                  {sending ? "Göndərilir..." : <><Icon name="send" size={16} /> Sorğu göndər</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
