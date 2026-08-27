"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";
import { usePathname } from "next/navigation";

const AGRO_FACTS = [
  "AI Aqronom xəstəlikləri şəkillə tanıyır",
  "Hansı gübrənin lazımdır? Bizdən soruşun",
  "Bitkilərinizdə saralma var? Şəklin yükləyin",
  "Süni intellekt məhsuldarlığınızı artıra bilər",
  "Düzgün dərmanlama vaxtını bizimlə təyin edin",
  "Sahənizdəki zərərvericiləri avtomatik kəşf edin"
];

export default function AIAgronomWidget() {
  const pathname = usePathname();
  const [currentFact, setCurrentFact] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Don't show on the agronom page itself or admin pages
  if (pathname?.includes("/agronom") || pathname?.includes("/admin") || pathname?.includes("/dashboard")) {
    return null;
  }

  useEffect(() => {
    // Start interval to show random facts
    const cycleFact = () => {
      const fact = AGRO_FACTS[Math.floor(Math.random() * AGRO_FACTS.length)];
      setCurrentFact(fact);
      setIsVisible(true);
      
      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // First fact after 3 seconds
    const initialTimeout = setTimeout(cycleFact, 3000);
    
    // Then every 15 seconds
    const interval = setInterval(cycleFact, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Toast bubble */}
      <div 
        className={`mb-4 px-4 py-3 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-[250px] transition-all duration-500 ease-out origin-bottom-right
          ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"}
        `}
      >
        <div className="flex gap-2 items-start">
          <div className="shrink-0 mt-0.5 text-violet-600">
            <Icon name="sparkles" size={16} />
          </div>
          <p className="text-sm text-gray-700 font-medium leading-tight">
            {currentFact}
          </p>
        </div>
        
        {/* Triangle pointer */}
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
      </div>

      {/* FAB Button */}
      <Link 
        href="/agronom"
        className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 bg-violet-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-violet-700"
      >
        <Icon name="messageSquare" size={26} className="text-white" />
        
        {/* Pulse effect */}
        <div className="absolute inset-0 rounded-full border-2 border-violet-500 animate-ping opacity-20"></div>
        
        {/* Status dot */}
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
        </div>
      </Link>
    </div>
  );
}
