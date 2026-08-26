import React from 'react';
import { Link } from "@/i18n/routing";
import Icon from '@/components/ui/Icon';
import { prisma } from "@/lib/prisma";
import SafeImage from "@/components/SafeImage";
import SideBanner from "@/components/Banners/SideBanner";

export const metadata = {
  title: 'Kampaniyalar və Endirimlər | FermerMarket',
  description: 'FermerMarket-də mövcud olan ən son kampaniyalar, endirimli aqro məhsullar və topdan satış təklifləri.',
};

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    orderBy: { endDate: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[1600px] mx-auto flex gap-6 px-4 py-8">
        <SideBanner position="left" />
        <div className="flex-1 min-w-0 w-full bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-700 to-green-600 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/pattern.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/30 backdrop-blur-md">Xüsusi Təkliflər</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Kampaniyalar və Endirimlər</h1>
          <p className="text-lg md:text-xl text-green-50 opacity-90">
            Fermerlər üçün ən uyğun qiymətlər. Mövsümi endirimlərdən və topdan satış təkliflərindən yararlanın.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl -mt-10 relative z-20">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {campaigns.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <Icon name="tag" size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hazırda aktiv kampaniya yoxdur</h3>
              <p>Yeniliklərdən xəbərdar olmaq üçün bizi izləməyə davam edin.</p>
            </div>
          ) : (
            campaigns.map((campaign) => {
              // Calculate remaining days
              const daysLeft = Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              
              // Select a background based on type
              const getBgColors = (type) => {
                switch(type) {
                  case 'FLASH_SALE': return 'from-orange-400 to-red-500';
                  case 'DAILY_DEAL': return 'from-blue-500 to-indigo-600';
                  default: return 'from-brand-500 to-green-600';
                }
              };

              return (
                <div key={campaign.id} className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 flex flex-col">
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {campaign.bannerUrl ? (
                      <SafeImage src={campaign.bannerUrl} alt={campaign.title} fill className="object-cover" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${getBgColors(campaign.type)}`}></div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/20">
                      <span className="text-2xl md:text-3xl font-black text-center px-4">{campaign.title}</span>
                    </div>
                    {daysLeft > 0 && (
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-white/30">
                        <Icon name="clock" size={14} /> {daysLeft} gün qaldı
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{campaign.title}</h3>
                    <p className="text-gray-500 text-sm mb-6 flex-1">
                      Bu kampaniya {new Date(campaign.endDate).toLocaleDateString("az-AZ")} tarixinədək qüvvədədir. Endirimlərdən faydalanmağa tələsin.
                    </p>
                    <Link 
                      href={campaign.targetUrl || "/products"} 
                      className="w-full bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white font-bold py-3 rounded-xl transition-colors text-center inline-block"
                    >
                      Məhsullara Bax
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </div>
        <SideBanner position="right" />
      </div>
    </div>
  );
}
