"use client";
import Icon from "@/components/ui/Icon";
import { Link } from "@/i18n/routing";
import { useSiteTexts } from "@/lib/siteTexts";

export default function AgronomCard() {
  const { t } = useSiteTexts();

  const featurePills = [
    { label: t('homepage.agronomFeat1', 'Xəstəlik Analizi'), icon: "bug" },
    { label: t('homepage.agronomFeat2', 'Gübrə Məsləhəti'), icon: "flask" },
    { label: t('homepage.agronomFeat3', 'Hava Proqnozu'), icon: "thermometer" },
    { label: t('homepage.agronomFeat4', 'Qiymət İndeksi'), icon: "barChart" },
    { label: t('homepage.agronomFeat5', 'Əkin Təqvimi'), icon: "calendar" }
  ];

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-green-50 border border-green-100 p-6 md:p-8">
        {/* Deco */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-green-100/50 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-emerald-100/50 translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-4xl shrink-0">
            <Icon name="bot" size={24} className="text-brand-600" />
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              {t('homepage.agronomBadge', 'AI ilə işləyir')}
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">{t('homepage.agronomTitle', 'AI Aqronom')}</h2>
            <p className="text-gray-600 text-sm max-w-sm">
              {t('homepage.agronomDesc', 'Bitkinizdə xəstəlik var? Şəkil göndərin, AI analiz etsin. Torpaq, məhsul, iqlim haqqında sual verin.')}
            </p>
            <div className="flex flex-wrap gap-2.5 mt-4">
              <Link href="/agronom" className="flex items-center gap-2 btn-primary text-sm">
                <span className="flex items-center gap-1"><Icon name="camera" size={16} /> {t('homepage.agronomSendPhoto', 'Şəkil Göndər')}</span>
              </Link>
              <Link href="/agronom" className="flex items-center gap-2 btn-secondary text-sm">
                <span className="flex items-center gap-1"><Icon name="message" size={16} /> {t('homepage.agronomAskQuestion', 'Sual Ver')}</span>
              </Link>
            </div>
          </div>

          {/* Illustration */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="text-brand-500 flex justify-center"><Icon name="sprout" size={64} /></div>
            <div className="text-xs text-gray-400 font-medium">{t('homepage.agronomActiveTime', '24/7 aktiv')}</div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="relative flex flex-wrap gap-2 mt-5 pt-5 border-t border-green-100">
          {featurePills.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs bg-brand-50 text-brand-700 px-3 py-1.5 rounded-xl">
              <Icon name={item.icon || "info"} size={14} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
