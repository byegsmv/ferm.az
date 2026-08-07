"use client";
import Icon from "@/components/ui/Icon";
import { useEffect, useRef, useState } from "react";
import { useSiteTexts } from "@/lib/siteTexts";

function useCountUp(target, started) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, started]);
  return count;
}

function StatCard({ stat, started, index }) {
  const count = useCountUp(stat.value, started);
  return (
    <div
      className="group relative overflow-hidden rounded-2xl md:rounded-[20px] border border-gray-100 bg-white p-4 sm:p-5 md:p-6 text-center shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 hover:border-brand-200 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${0.1 + index * 0.08}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50/0 to-brand-50/0 group-hover:from-brand-50/60 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
      <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-brand-50 text-brand-600 mx-auto mb-2.5 sm:mb-3 group-hover:scale-110 group-hover:bg-brand-100 transition-all duration-300">
        <Icon name={stat.iconName} size={20} strokeWidth={2} className="sm:w-6 sm:h-6" />
      </div>
      <div className="relative text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tabular-nums tracking-tight">
        {count.toLocaleString("az-AZ")}{stat.suffix}
      </div>
      <div className="relative text-[11px] sm:text-xs md:text-sm text-gray-500 mt-1 font-semibold leading-tight">{stat.label}</div>
    </div>
  );
}

export default function StatsSection() {
  const { t } = useSiteTexts();
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  const stats = [
    { value: 15000, suffix: "+", label: t('homepage.statActiveListings', 'Aktiv Elan'), iconName: "clipboard" },
    { value: 4500,  suffix: "+", label: t('homepage.statFarmers', 'Fermer'), iconName: "sprout" },
    { value: 1200,  suffix: "+", label: t('homepage.statStores', 'Mağaza'), iconName: "store" },
    { value: 98,    suffix: "%", label: t('homepage.statSatisfiedUsers', 'Məmnun İstifadəçi'), iconName: "star" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
      <div className="mb-4 md:mb-5">
        <h2 className="section-title">{t('homepage.statsTitle', 'Niyə FermerMarket?')}</h2>
        <p className="section-subtitle">{t('homepage.statsSubtitle', 'Azərbaycanlı fermerlər bizi seçir')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
        {stats.map((s, i) => <StatCard key={s.label} stat={s} started={started} index={i} />)}
      </div>
    </section>
  );
}
