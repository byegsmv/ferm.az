import React from "react";
import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "İstifadə Şərtləri | FermerMarket",
  description: "FermerMarket aqrar bazar platformasından istifadə qaydaları, istifadəçi öhdəlikləri və şərtləri.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-900 py-16 md:py-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-4 border border-white/10">
            <Icon name="file-text" size={14} />
            Hüquqi Sənəd
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            İstifadə Şərtləri
          </h1>
          <p className="text-emerald-100 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            FermerMarket platformasından istifadə edərkən tətbiq olunan qaydalar, hüquqlar və öhdəliklər haqqında ətraflı məlumat.
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
              <h2 className="text-xl font-bold text-gray-900">Ümumi Müddəalar</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              Bu İstifadə Şərtləri (&quot;Şərtlər&quot;), <strong>FermerMarket</strong> (&quot;Platforma&quot;, &quot;Biz&quot;) tərəfindən təqdim olunan veb-sayt, mobil tətbiq və digər rəqəmsal xidmətlərin istifadəsini tənzimləyir.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              FermerMarket platformasından istifadə etməklə, qeydiyyatdan keçməklə və ya elan yerləşdirməklə bu Şərtləri tam şəkildə qəbul etdiyinizi təsdiq edirsiniz. Şərtlərlə razılaşmadığınız təqdirdə platformadan istifadəni dayandırmalısınız.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                2
              </span>
              <h2 className="text-xl font-bold text-gray-900">Hesabın Qeydiyyatı və Təhlükəsizliyi</h2>
            </div>
            <ul className="space-y-3 text-gray-600 text-sm md:text-base list-disc pl-5 leading-relaxed">
              <li>
                Platformada qeydiyyatdan keçərkən dürüst, dəqiq və yenilənmiş məlumatlar təqdim etməlisiniz.
              </li>
              <li>
                Hesabınızın daxil olma məlumatlarının (şifrə və istifadəçi adı) məfıilliyini və təhlükəsizliyini qorumaq istifadəçinin öz məsuliyyətidir.
              </li>
              <li>
                Hesabınız vasitəsilə həyata keçirilən bütün fəaliyyətlərə görə birbaşa siz cavabdehsiniz.
              </li>
              <li>
                İstifadəçi 18 yaşına çatmış və ya qanuni nümayəndəsinin razılığı ilə fəaliyyət göstərən fərd və ya hüquqi şəxs olmalıdır.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                3
              </span>
              <h2 className="text-xl font-bold text-gray-900">Elan Yerləşdirilməsi və Qaydalar</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              FermerMarket aqrar sektor üzrə elanların yerləşdirildiyi platformadır. Bütün istifadəçilər aşağıdakı elan yerləşdirmə qaydalarına əməl etməlidir:
            </p>
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2 text-sm text-gray-700">
              <div className="font-semibold text-gray-900 mb-2">Qadağan Olunmuş Məzmunlar:</div>
              <p>• Yalan, yanıltıcı və ya saxta məhsul/xidmət təsvirləri;</p>
              <p>• Azərbaycan Respublikasının qanunvericiliyi ilə qadağan olunmuş dərmanlar, təhlükəli maddələr və ya lisenziyasız məhsullar;</p>
              <p>• Üçüncü tərəflərin müəllif hüquqlarını, əmtəə nişanlarını və ya digər fikri mülkiyyət hüquqlarını pozan elanlar;</p>
              <p>• Təhqiramiz, zorakılıq təbliğ edən və ya qeyri-etik kontent.</p>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              FermerMarket moderatorları bu qaydaları pozan elanları xəbərdarlıq etmədən düzəliş etmək, silmək və ya müvafiq hesabı bloklamaq hüququnu özündə saxlayır.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                4
              </span>
              <h2 className="text-xl font-bold text-gray-900">Öhdəliklər və Məsuliyyətin Məhdudlaşdırılması</h2>
            </div>
            <ul className="space-y-3 text-gray-600 text-sm md:text-base list-disc pl-5 leading-relaxed">
              <li>
                <strong>FermerMarket</strong> alıcılar və satıcılar arasında məhsul və xidmət mübadiləsini asanlaşdıran platformadır. Platforma alqı-satqı müqavilələrinin tərəfi deyil və məhsulların keyfiyyətinə, çatdırılmasına və ödəniş razılaşmalarına birbaşa cavabdehlik daşımır.
              </li>
              <li>
                <strong>AI Aqronom xidməti:</strong> Platformadakı AI Aqronom məsləhətləri yalnız məlumatlandırma və tövsiyə xarakteri daşıyır. Mütəxəssis müayinəsini tam əvəz etmir.
              </li>
              <li>
                Texniki fasilələr, profilaktik işlər və ya fors-major hallarda platformanın müvəqqəti əlçatmaz olmasına görə FermerMarket məsuliyyət daşımır.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                5
              </span>
              <h2 className="text-xl font-bold text-gray-900">Fikri Mülkiyyət Hüquqları</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              FermerMarket platformasında yer alan dizayn, proqram kodu, loqolar, mətnlər, qrafik elementlər və ticarət nişanları FermerMarket-ə məxsusdur və müəlliflik hüquqları ilə qorunur. İcazəsiz kopyalanması və ya kommersiya məqsədilə istifadəsi qadağandır.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                6
              </span>
              <h2 className="text-xl font-bold text-gray-900">Şərtlərin Dəyişdirilməsi</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base">
              FermerMarket bu Şərtləri istənilən zaman yeniləmək hüququna malikdir. Yenilənmiş şərtlər bu səhifədə dərc edildiyi andan qüvvəyə minir. İstifadəçilərə dəyişiklikləri mütəmadi olaraq nəzərdən keçirmək tövsiyə olunur.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-brand-50/60 rounded-2xl p-6 border border-brand-100 space-y-3">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Icon name="message-circle" size={20} className="text-brand-600" />
              Bizimlə Əlaqə
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              İstifadə şərtləri ilə bağlı sual, təklif və ya şikayətləriniz üçün bizim dəstək komandamızla əlaqə saxlaya bilərsiniz:
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-sm">
              <Link href="/contact" className="inline-flex items-center gap-2 text-brand-700 font-semibold hover:underline">
                <span className="inline-flex items-center gap-1">Əlaqə səhifəsinə keçid <Icon name="arrowRight" size={14} /></span>
              </Link>
              <a href="mailto:info@fermermarket.az" className="text-gray-600 hover:text-brand-600 font-medium">
                info@fermermarket.az
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
