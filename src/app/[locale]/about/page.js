import React from 'react';
import Icon from '@/components/ui/Icon';

export const metadata = {
  title: 'Haqqımızda | FermerMarket',
  description: 'FermerMarket aqro satış platforması haqqında ətraflı məlumat.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* Hero */}
      <div className="bg-brand-700 py-24 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            Kənd Təsərrüfatının <br className="hidden md:block"/> Gələcəyini Qururuq
          </h1>
          <p className="text-xl text-green-50 max-w-2xl mx-auto font-medium">
            Biz sadəcə alqı-satqı platforması deyilik, fermerlərin və aqronomların rəqəmsal ekosistemiyik.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl -mt-12 relative z-20">
        
        {/* Intro Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-white mb-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Biz Kimik?</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                <strong>FermerMarket</strong>, Azərbaycanda kənd təsərrüfatı sektorunu tamamilə rəqəmsallaşdırmaq və asanlaşdırmaq üçün yaradılmış innovativ aqrar bazardır. 
              </p>
              <p className="text-gray-600 leading-relaxed">
                Əsas məqsədimiz fermerlərə məhsulları yalnız marka adına görə deyil, tərkibinə, təsir sahəsinə və qiymətinə görə müqayisə etmək imkanı verərək ən doğru qərarı almalarını təmin etməkdir.
              </p>
            </div>
            <div className="relative h-64 md:h-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-500 to-green-300 opacity-90"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                <Icon name="sprout" size={64} className="mb-4 drop-shadow-md" />
                <h3 className="font-bold text-2xl drop-shadow-sm">İnnovasiya və Aqrotexnika</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Grid */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Bizim Missiyamız</h2>
          <p className="text-gray-500 mt-2">Niyə FermerMarket-i seçməlisiniz?</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-brand-200 group">
            <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors">
              <Icon name="git-merge" size={24} />
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-3">Tərkib Müqayisəsi</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Biz dərman və gübrələri aktiv maddəsinə görə qruplaşdırırıq. Eyni təsirə malik fərqli markaları və qiymətləri bir ekranda müqayisə edin.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-brand-200 group">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Icon name="shield" size={24} />
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-3">Açıq Rəqabət</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Şirkətlərin və satıcıların təklifləri şeffaf şəkildə sıralanır. Həm satıcı, həm də alıcı üçün ən sərfəli və ədalətli mühiti yaradırıq.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-brand-200 group">
            <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Icon name="cpu" size={24} />
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-3">AI Aqronom Dəstəyi</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Xəstəlik və zərərvericini tapa bilmirsiniz? Süni intellekt əsaslı aqronomumuz sizə birbaşa diaqnoz və düzgün məhsul tövsiyə edəcək.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
