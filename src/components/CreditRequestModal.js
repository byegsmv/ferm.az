"use client";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function CreditRequestModal({ product }) {
  const [isOpen, setIsOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Phone number from store configuration, falling back to default
  const creditPhoneNumber = product?.store?.installmentWhatsapp?.replace(/[^0-9]/g, "") || "994102238989";

  const handleWhatsAppRedirect = () => {
    if (!accepted) return;
    const message = `Salam, "${product.titleAz}" (Qiymət: ${product.price} AZN, Kod: ${product.code || product.id}) məhsulunu kreditlə almaq istəyirəm. İlkin yoxlama üçün şəxsiyyət vəsiqəmin şəkillərini əlavə edirəm.`;
    const url = `https://wa.me/${creditPhoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-3 transition shadow-sm active:scale-95"
      >
        <Icon name="creditCard" size={20} />
        Kreditlə Al (ABB / Kapital Bank)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-900 text-lg">Kredit Müraciəti</h2>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-blue-900 flex gap-3">
                <Icon name="info" size={24} className="text-blue-500 shrink-0 mt-0.5" />
                <p>
                  Sifarişi tamamlamaq üçün <strong className="font-semibold text-blue-900">Şəxsiyyət Vəsiqənizin ön və arxa üzünün şəklini</strong> WhatsApp vasitəsilə Kredit Şöbəmizə göndərməyiniz kifayətdir.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm border border-gray-100">
                <p className="text-gray-500 mb-1">Məhsul:</p>
                <p className="font-bold text-gray-900 line-clamp-1">{product.titleAz}</p>
                <p className="font-bold text-brand-700 mt-1">{product.price} AZN</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded border border-gray-300 bg-white group-hover:border-blue-500 transition-colors shrink-0">
                  <input
                    type="checkbox"
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                  />
                  {accepted && (
                    <div className="bg-blue-600 absolute inset-0 rounded flex items-center justify-center">
                      <Icon name="check" size={14} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600 select-none">
                  Şəxsiyyət vəsiqəmin və şəxsi məlumatlarımın yalnız kreditin rəsmiləşdirilməsi məqsədilə istifadəsinə və məxfiliyin qorunmasına razıyam.
                </span>
              </label>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)} 
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition"
              >
                Ləğv et
              </button>
              <button 
                onClick={handleWhatsAppRedirect}
                disabled={!accepted}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition shadow-sm ${
                  accepted 
                    ? "bg-[#25D366] hover:bg-[#1DA851] active:scale-95" 
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.032c0 2.13.551 4.19 1.597 6.012L.15 24l6.104-1.602a11.967 11.967 0 005.777 1.493c6.646 0 12.031-5.386 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm7.151 17.202c-.307.865-1.782 1.583-2.464 1.636-.629.049-1.439.117-4.61-1.196-3.799-1.574-6.241-5.449-6.433-5.705-.189-.256-1.536-2.046-1.536-3.9 0-1.854.968-2.766 1.314-3.15.345-.383.753-.48 1.003-.48.249 0 .5.002.723.013.232.012.544-.088.852.656.319.768 1.09 2.666 1.189 2.868.098.203.164.44.032.705-.132.266-.201.43-.401.664-.199.234-.415.516-.596.691-.197.189-.404.398-.179.78.225.381 1.003 1.652 2.152 2.678 1.487 1.327 2.738 1.737 3.13 1.933.393.197.622.164.853-.1.232-.266.994-1.164 1.258-1.564.264-.4.529-.333.886-.197.357.135 2.253 1.06 2.64 1.258.386.197.643.296.737.461.093.164.093.957-.214 1.822z"/></svg>
                WhatsApp-la Müraciət Et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
