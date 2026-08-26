import React from "react";
import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "Məxfilik Siyasəti | FermerMarket",
  description: "FermerMarket platformasında şəxsi məlumatların toplanması, istifadəsi, çerezlər və təhlükəsizlik siyasəti.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-900 py-16 md:py-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-4 border border-white/10">
            <Icon name="shield" size={14} />
            Məxfilik & Təhlükəsizlik
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Məxfilik Siyasəti
          </h1>
          <p className="text-emerald-100 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            FermerMarket şəxsi məlumatlarınızın qorunmasına və məfıilliyin təmin edilməsinə xüsusi diqqət yetirir.
          </p>
          <p className="text-xs text-emerald-200/70 mt-4">
            Son yenilənmə: 2 Avqust 2026
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-10">
          
          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                1
              </span>
              <h2 className="text-xl font-bold text-gray-900">Ümumi Məlumat</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              Bu Məxfilik Siyasəti, <strong>FermerMarket</strong> platformasından istifadə edərkən toplanan, emal edilən və saxlanılan şəxsi məlumatlarınızın necə idarə olunduğunu izah edir.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              Bizim məqsədimiz istifadəçilərimiz üçün təhlükəsiz, şəffaf və rahat aqrar marketplace mühiti təmin etməkdir.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                2
              </span>
              <h2 className="text-xl font-bold text-gray-900">Toplanılan Məlumatlar</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              Platformamızdan istifadə edərkən aşağıdakı növ məlumatlar toplanıla bilər:
            </p>
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Icon name="user" size={16} className="text-brand-600" />
                  Qeydiyyat Məlumatları
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ad, soyad, telefon nömrəsi, e-poçt ünvanı, yerləşdiyiniz rayon və mağaza/ferma məlumatları.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Icon name="package" size={16} className="text-brand-600" />
                  Elan Məlumatları
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Məhsul adları, təsvirləri, qiymətlər, fotoşəkillər və alıcılar üçün əlaqə vasitələri.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Icon name="cpu" size={16} className="text-brand-600" />
                  AI & Məsləhət Məlumatları
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  AI Aqronom sorğuları, bitki/xəstəlik fotoşəkilləri və aqrar məsləhət tarixçəsi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Icon name="info" size={16} className="text-brand-600" />
                  Texniki Məlumatlar
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  IP ünvanı, cihaz növü, brauzer versiyası, giriş vaxtları və platformadakı səhifə naviqasiyası.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                3
              </span>
              <h2 className="text-xl font-bold text-gray-900">Məlumatların İstifadə Məqsədləri</h2>
            </div>
            <ul className="space-y-3 text-gray-600 text-sm md:text-base list-disc pl-5 leading-relaxed">
              <li>Platformanın əsas funksiyalarını (elan yerləşdirmə, alıcı-satıcı əlaqəsi) təmin etmək;</li>
              <li>AI Aqronom xidmətini fərdiləşdirərək dəqiq aqronomik tövsiyələr vermək;</li>
              <li>Sifarişlər, mesajlar və elan statusları haqqında bildirişlər göndərmək;</li>
              <li>Fırıldaqçılığın və icazəsiz fəaliyyətlərin qarşısını almaq, təhlükəsizliyi təmin etmək;</li>
              <li>Xidmət keyfiyyətini və platformanın istifadə rahatlığını artırmaq.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                4
              </span>
              <h2 className="text-xl font-bold text-gray-900">Çerezlər (Cookies)</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              FermerMarket veb-saytın işini optimallaşdırmaq, sessiyaları saxlamaq və istifadəçi təcrübəsini təkmilləşdirmək üçün çerezlərdən (cookies) istifadə edir. Brauzerinizin tənzimləmələrindən çerezləri söndürə bilərsiniz, lakin bu halda saytın bəzi funksiyaları məhdudlaşa bilər.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                5
              </span>
              <h2 className="text-xl font-bold text-gray-900">Məlumatların Paylaşılması və Üçüncü Tərəflər</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              Biz istifadəçilərimizin şəxsi məlumatlarını üçüncü tərəflərə satmırıq və icazəsiz ötürmürük. Məlumatlar yalnız aşağıdakı istisna hallarda paylaşılır:
            </p>
            <ul className="space-y-2 text-gray-600 text-sm md:text-base list-disc pl-5 leading-relaxed">
              <li>Qanunla tələb olunduqda (dövlət və hüquq-mühafizə orqanlarının rəsmi sorğuları zamanı);</li>
              <li>Xidmətlərin göstərilməsini təmin edən təhlükəsiz texniki tərəfdaşlar (hostinq, sms/e-poçt bildiriş xidmətləri) ilə məhdud çərçivədə;</li>
              <li>İstifadəçinin özünün birbaşa elanda göstərdiyi əlaqə məlumatları alıcılar üçün görünür.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                6
              </span>
              <h2 className="text-xl font-bold text-gray-900">Məlumatların Təhlükəsizliyi</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              Məlumatlarınızın mühafizəsi üçün müasir SSL/TLS şifrələmə standartları, təhlükəsiz serverlər və daxili təhlükəsizlik protokolları tətbiq olunur. Şəxsi məlumatlarınıza yalnız səlahiyyətli heyət çıxış əldə edə bilir.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                7
              </span>
              <h2 className="text-xl font-bold text-gray-900">İstifadəçi Hüquqları</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              İstifadəçilər öz şəxsi məlumatlarına baxmaq, məlumatları yeniləmək və ya hesablarının tam silinməsini tələb etmək hüququna malikdirlər. Hesabınızın və məlumatlarınızın silinməsi üçün bizimlə əlaqə saxlaya bilərsiniz.
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-brand-50/60 rounded-2xl p-6 border border-brand-100 space-y-3">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Icon name="message-circle" size={20} className="text-brand-600" />
              Məxfiliklə Bağlı Əlaqə
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Məxfilik siyasətimiz və ya şəxsi məlumatlarınızın emalı ilə bağlı hər hansı sualınız olduqda bizim məxfilik komandamızla əlaqə saxlayın:
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-sm">
              <Link href="/contact" className="inline-flex items-center gap-2 text-brand-700 font-semibold hover:underline">
                <span className="inline-flex items-center gap-1">Əlaqə səhifəsinə keçid <Icon name="arrowRight" size={14} /></span>
              </Link>
              <a href="mailto:privacy@fermermarket.az" className="text-gray-600 hover:text-brand-600 font-medium">
                privacy@fermermarket.az
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
