"use client";
import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import toast from 'react-hot-toast';
import { useSiteTexts } from "@/lib/siteTexts";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const { t: st } = useSiteTexts();
  
  // Dynamic fields
  const phone = st("footer.phone", "+994 10 223 89 89");
  const phoneTel = phone.replace(/[^\d+]/g, "");
  const email = st("footer.email", "info@fermermarket.az");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convert phone to string and use email if not provided (fallback)
    if (!data.email) data.email = "no-email@fermermarket.az";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Xəta baş verdi");
      toast.success("Mesajınız uğurla göndərildi. Tezliklə əlaqə saxlayacağıq.");
      e.target.reset();
    } catch (err) {
      toast.error("Mesaj göndərilərkən xəta baş verdi. Zəhmət olmasa yenidən yoxlayın.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Bizimlə Əlaqə</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Hər hansı sualınız, təklifiniz və ya şikayətiniz varsa, bizimlə əlaqə saxlamaqdan çəkinməyin. Komandamız sizə ən qısa zamanda geri dönüş edəcək.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Contact Info Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shrink-0">
                <Icon name="phone" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Müştəri Xidmətləri</h3>
                <p className="text-gray-500 text-sm mb-2">Həftəiçi: 09:00 - 18:00</p>
                <a href={`tel:${phoneTel}`} className="text-brand-600 font-bold hover:underline">{phone}</a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                <Icon name="message" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Elektron Poçt</h3>
                <p className="text-gray-500 text-sm mb-2">Bizə 7/24 yaza bilərsiniz</p>
                <a href={`mailto:${email}`} className="text-brand-600 font-bold hover:underline">{email}</a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
                <Icon name="map-pin" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Ünvan</h3>
                <p className="text-gray-500 text-sm">Bakı şəhəri, Azərbaycan</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-white h-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bizə Yazın</h2>
              
              {/* Form is handled via client-side fetch */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Adınız və Soyadınız</label>
                    <input 
                      type="text" 
                      name="name" 
                      required
                      placeholder="Ad Soyad"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Əlaqə nömrəsi</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required
                      placeholder="(050) 000 00 00"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Mövzu</label>
                  <select 
                    name="subject" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:bg-white transition-all outline-none"
                  >
                    <option value="general">Ümumi sual</option>
                    <option value="support">Texniki dəstək</option>
                    <option value="partnership">Əməkdaşlıq</option>
                    <option value="complaint">Şikayət</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Mesajınız</label>
                  <textarea 
                    name="message" 
                    rows="5" 
                    required
                    placeholder="Bizə nə demək istəyirsiniz?"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:bg-white transition-all outline-none resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full ${loading ? "bg-gray-400" : "bg-brand-600 hover:bg-brand-700"} text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2`}
                >
                  <Icon name={loading ? "loader" : "send"} size={20} className={loading ? "animate-spin" : ""} />
                  {loading ? "Göndərilir..." : "Mesajı Göndər"}
                </button>
              </form>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
