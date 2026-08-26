"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { useSiteTexts } from "@/lib/siteTexts";

const CITIES = [
  "Bakı", "Ağcabədi", "Ağdam", "Ağdaş", "Ağdərə", "Ağstafa", "Ağsu", "Astara", 
  "Balakən", "Bərdə", "Beyləqan", "Biləsuvar", "Cəbrayıl", "Cəlilabad", "Daşkəsən", 
  "Füzuli", "Gədəbəy", "Gəncə", "Goranboy", "Göyçay", "Göygöl", "Hacıqabul", "İmişli", 
  "İsmayıllı", "Kəlbəcər", "Kürdəmir", "Laçın", "Lənkəran", "Lerik", "Masallı", 
  "Mingəçevir", "Naftalan", "Naxçıvan", "Neftçala", "Oğuz", "Qax", "Qazax", "Qəbələ", 
  "Qobustan", "Quba", "Qubadlı", "Qusar", "Saatlı", "Sabirabad", "Şabran", "Salyan", 
  "Şamaxı", "Samux", "Şəki", "Şəmkir", "Şirvan", "Siyəzən", "Sumqayıt", "Şuşa", 
  "Tərtər", "Tovuz", "Ucar", "Xaçmaz", "Xankəndi", "Xırdalan", "Xızı", "Xocalı", 
  "Xocavənd", "Xudat", "Yardımlı", "Yevlax", "Zaqatala", "Zəngilan", "Zərdab"
];

export default function CitySelectModal({ isOpen, onClose, onSelect, currentCity }) {
  const { t: st } = useSiteTexts();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mx-auto w-full text-center">{st("city.modalTitle", "Şəhərinizi seçin")}</h2>
          <button
            onClick={onClose}
            aria-label={st("nav.closeModal", "Bağla")}
            className="absolute right-4 sm:right-6 top-4 sm:top-6 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-3 sm:gap-y-4 gap-x-2">
            {CITIES.map((city) => {
              const isSelected = city === currentCity;
              return (
                <button
                  key={city}
                  onClick={() => onSelect(city)}
                  className={`flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-left transition-all ${
                    isSelected
                      ? "text-brand-600 font-bold bg-brand-50/50"
                      : "text-gray-700 font-medium hover:bg-gray-50 hover:text-brand-600"
                  }`}
                >
                  <span className="truncate text-sm">{city}</span>
                  {isSelected && <Icon name="check" size={18} className="text-brand-600 shrink-0 ml-2" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
