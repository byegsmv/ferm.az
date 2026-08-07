"use client";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useEffect, useState, useRef } from "react";
import { getUser } from "@/lib/apiClient";
import { getCart, cartCount } from "@/lib/cartClient";
import NotificationBell from "@/components/NotificationBell";
import { useLocale, useTranslations } from "next-intl";
import { LOCALE_LABELS } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";
import WeatherWidget from "@/components/home/WeatherWidget";
import CitySelectModal from "@/components/CitySelectModal";
import { useSiteTexts } from "@/lib/siteTexts";

export default function Header() {
  const { t: st } = useSiteTexts();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Navigation');

  const ROLE_LABELS = {
    SUPER_ADMIN: st("role.superAdmin", "Super Admin"),
    ADMIN: st("role.admin", "Admin"),
    MODERATOR: st("role.moderator", "Moderator"),
    FARMER: st("role.farmer", "Fermer"),
    STORE: st("role.store", "Mağaza"),
    AGRONOMIST: st("role.agronomist", "Aqronom"),
    BUYER: st("role.buyer", "Alıcı"),
    DELIVERY_PARTNER: st("role.deliveryPartner", "Çatdırılma"),
  };

  const [user, setUser] = useState(null);
  const [count, setCount] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [wallet, setWallet] = useState(null);

  const NAV_LINKS = [
    { href: "/products", label: st("nav.products", "Məhsullar") },
    { href: "/categories", label: st("nav.categories", "Kateqoriyalar") },
    { href: "/brands", label: st("nav.brands", "Brendlər") },
    { href: "/campaigns", label: st("nav.campaigns", "Kampaniyalar") },
    { href: "/stores", label: st("nav.stores", "Mağazalar") },
    { href: "/agronom", label: st("nav.agronom", "Aqronom") },
    { href: "/blog", label: st("nav.blog", "Bloq") },
  ];

  useEffect(() => {
    setMounted(true);
    const savedCity = localStorage.getItem("fmk-selected-city");
    if (savedCity) {
      setSelectedCity(savedCity);
    } else if (!sessionStorage.getItem("fmk-city-modal-shown")) {
      sessionStorage.setItem("fmk-city-modal-shown", "1");
      setShowCityModal(true);
    }

    const sync = () => {
      const u = getUser();
      setUser(u);
      if (u) {
        fetchUnreadCount();
        fetchWalletData();
      } else {
        setWallet(null);
      }
    };
    const syncCart = () => setCount(cartCount(getCart()));
    sync(); syncCart();
    window.addEventListener("fmk-auth-changed", sync);
    window.addEventListener("fmk-cart-changed", syncCart);
    window.addEventListener("storage", sync);

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });

    const onClickOut = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOut);

    return () => {
      window.removeEventListener("fmk-auth-changed", sync);
      window.removeEventListener("fmk-cart-changed", syncCart);
      window.removeEventListener("storage", sync);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onClickOut);
    };
  }, []);

  async function fetchUnreadCount() {
    try {
      const { apiFetch } = await import("@/lib/apiClient");
      const data = await apiFetch("/api/conversations/unread");
      setUnreadMsg(data.count || 0);
    } catch {}
  }

  async function fetchWalletData() {
    try {
      const { apiFetch } = await import("@/lib/apiClient");
      const data = await apiFetch("/api/wallet");
      if (data?.wallet) {
        setWallet(data.wallet);
      }
    } catch {}
  }

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.dispatchEvent(new Event('fmk-auth-changed'));
    router.push(`/`);
  };

  const changeLanguage = (newLocale) => {
    if (locale === newLocale) return;
    
    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/(az|en|ru)(?=\/|$)/, '') || '/';

    router.push(pathWithoutLocale + window.location.search, { locale: newLocale });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const search = formData.get("search");
    if (search && search.trim() !== "") {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
    } else {
      router.push(`/products`);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    localStorage.setItem("fmk-selected-city", city);
    setShowCityModal(false);
  };

  return (
    <>
    <header
      className={`sticky top-0 z-50 transition-all duration-300 mt-2 md:mt-4 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100"
          : "bg-white border-b border-gray-100"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and City */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center group">
            <img src="/logo.png" alt={st("header.logoAlt", "FermerMarket Logo")} className="h-10 md:h-24 w-auto object-contain group-hover:scale-105 transition-transform duration-200" />
          </Link>
          
          <button 
            onClick={() => setShowCityModal(true)}
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 transition"
          >
            <Icon name="mapPin" size={18} />
            <span>{st("header.cityLabel", "Şəhər:")} <span className="font-bold text-gray-900">{mounted && selectedCity ? selectedCity : st("header.notSelected", "Seçilməyib")}</span></span>
          </button>
        </div>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg h-10 mx-4">
          <div className="flex w-full rounded-2xl border border-gray-200 overflow-hidden focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
            <input
              name="search"
              placeholder={st("header.searchPlaceholder", "Məhsul, şirkət, gübrə, texnika axtar...")}
              className="flex-1 min-w-0 h-full px-4 text-sm bg-gray-50 focus:outline-none focus:bg-white transition-colors"
            />
            <button
              type="submit"
              className="shrink-0 w-12 h-full flex items-center justify-center bg-brand-600 hover:bg-brand-700 text-white transition-colors"
            >
              <Icon name="search" size={18} strokeWidth={2.2} />
            </button>
          </div>
        </form>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Language  */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowLang((v) => !v)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-gray-200 hover:border-brand-300 bg-white text-sm font-semibold text-gray-700 transition shadow-sm"
            >
              <Icon name="globe" size={16} className="text-brand-600" />
              {locale.toUpperCase()}
            </button>
            {showLang && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 w-24">
                {Object.keys(LOCALE_LABELS).map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLanguage(l)}
                    className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-brand-50 transition ${
                      locale === l ? "text-brand-600 bg-brand-50/50" : "text-gray-700"
                    }`}
                  >
                    {LOCALE_LABELS[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/elan-yerlesdir"
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <Icon name="plus" size={16} strokeWidth={2.3} />
            {st("header.newListing", "Yeni Elan")}
          </Link>

          {user && (
            <Link href="/messages" className="relative w-11 h-11 flex items-center justify-center rounded-[14px] border border-gray-200 bg-white shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 hover:shadow-md hover:-translate-y-0.5 text-gray-700 transition-all duration-300 group">
              <Icon name="message" size={22} strokeWidth={2} className="group-hover:scale-110 transition-transform duration-300" />
              {unreadMsg > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-[12px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {unreadMsg > 9 ? "9+" : unreadMsg}
                </span>
              )}
            </Link>
          )}
          
          <Link href="/cart" className="relative w-11 h-11 flex items-center justify-center rounded-[14px] border border-gray-200 bg-white shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 hover:shadow-md hover:-translate-y-0.5 text-gray-700 transition-all duration-300 group">
            <Icon name="cart" size={22} strokeWidth={2} className="group-hover:scale-110 transition-transform duration-300" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[12px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 h-11 px-3.5 rounded-[14px] border border-gray-200 bg-white shadow-sm hover:border-brand-300 hover:bg-brand-50/50 text-sm font-semibold text-gray-800 transition-all duration-300"
              >
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                  {user.fullName?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="max-w-[80px] truncate">{user.fullName?.split(" ")[0]}</span>
                <Icon name="chevronDown" size={13} className={`text-gray-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 card shadow-xl p-2 text-sm z-50 rounded-2xl border border-gray-100">
                  <div className="px-3 py-2 border-b border-gray-100 mb-2">
                    <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                    {wallet && (
                      <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-brand-700 font-bold">₼{Number(wallet.balance || 0).toFixed(2)}</span>
                        <span className="text-amber-600 font-bold"><span className="flex items-center gap-1"><Icon name="coins" size={16} /> {Number(wallet.coins || 0).toFixed(0)}</span></span>
                      </div>
                    )}
                  </div>
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-50 hover:text-brand-700 font-medium transition" onClick={() => setMenuOpen(false)}>
                      <Icon name="layoutDashboard" size={16} /> {st("header.adminPanel", "Admin Panel")}
                    </Link>
                  )}
                  {user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'MODERATOR' && (
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-50 hover:text-brand-700 font-medium transition" onClick={() => setMenuOpen(false)}>
                      <Icon name="dashboard" size={16} /> {st("header.dashboard", "İdarə paneli")}
                    </Link>
                  )}
                  <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 font-medium mt-1 transition">
                    <Icon name="logout" size={16} /> {st("header.logout", "Çıxış")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="ml-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm px-5 py-2 rounded-xl transition">{st("header.loginButton", "Giriş")}</Link>
          )}
        </div>

        {/* Mobile  icons */}
        <div className="md:hidden flex items-center gap-2 ml-auto">
          {user && <NotificationBell />}
          
          {/* Mobile Cart  */}
          <Link href="/cart" className="relative w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm active:scale-95 transition-transform">
            <Icon name="cart" size={20} strokeWidth={2} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm animate-pulse">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
          
          {/* Mobile Lang  */}
          <button
            onClick={() => {
              const next = locale === "az" ? "en" : locale === "en" ? "ru" : "az";
              changeLanguage(next);
            }}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 bg-white"
          >
            {locale.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Desktop Menyu */}
      <div className="hidden md:block border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-11 flex items-center justify-between">
          <nav className="flex items-center gap-1 shrink-0">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-[15px] px-3 py-2 rounded-[14px] font-bold text-gray-600 whitespace-nowrap shrink-0 hover:text-brand-700 hover:bg-brand-50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <WeatherWidget />
            {/* Facebook */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center rounded-[14px] border border-gray-200 bg-white shadow-sm text-gray-500 hover:border-[#1877F2] hover:bg-[#1877F2]/5 hover:text-[#1877F2] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform duration-300"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
            </a>
            {/* Instagram */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center rounded-[14px] border border-gray-200 bg-white shadow-sm text-gray-500 hover:border-[#E1306C] hover:bg-[#E1306C]/5 hover:text-[#E1306C] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform duration-300"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            {/* WhatsApp */}
            <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center rounded-[14px] border border-gray-200 bg-white shadow-sm text-gray-500 hover:border-[#25D366] hover:bg-[#25D366]/5 hover:text-[#25D366] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform duration-300"><path d="M12.031 0C5.385 0 0 5.385 0 12.032c0 2.13.551 4.19 1.597 6.012L.15 24l6.104-1.602a11.967 11.967 0 005.777 1.493c6.646 0 12.031-5.386 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm7.151 17.202c-.307.865-1.782 1.583-2.464 1.636-.629.049-1.439.117-4.61-1.196-3.799-1.574-6.241-5.449-6.433-5.705-.189-.256-1.536-2.046-1.536-3.9 0-1.854.968-2.766 1.314-3.15.345-.383.753-.48 1.003-.48.249 0 .5.002.723.013.232.012.544-.088.852.656.319.768 1.09 2.666 1.189 2.868.098.203.164.44.032.705-.132.266-.201.43-.401.664-.199.234-.415.516-.596.691-.197.189-.404.398-.179.78.225.381 1.003 1.652 2.152 2.678 1.487 1.327 2.738 1.737 3.13 1.933.393.197.622.164.853-.1.232-.266.994-1.164 1.258-1.564.264-.4.529-.333.886-.197.357.135 2.253 1.06 2.64 1.258.386.197.643.296.737.461.093.164.093.957-.214 1.822z"/></svg>
            </a>
            {/* TikTok */}
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center rounded-[14px] border border-gray-200 bg-white shadow-sm text-gray-500 hover:border-black hover:bg-black/5 hover:text-black hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform duration-300"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v8.12c0 2.26-.67 4.54-2.12 6.27-1.46 1.74-3.61 2.8-5.91 2.94-2.31.14-4.66-.46-6.49-1.92-1.84-1.47-3.05-3.66-3.23-5.99-.18-2.32.61-4.69 2.22-6.38 1.61-1.69 3.91-2.6 6.25-2.58v4.07c-.9-.05-1.81.16-2.58.63-.78.47-1.4 1.18-1.72 2.01-.31.83-.34 1.76-.08 2.61.26.85.79 1.6 1.48 2.08.7.47 1.57.69 2.44.6.87-.09 1.69-.5 2.3-1.14.61-.64.99-1.5.99-2.39V0h3.86l.01.02z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden w-full pb-3 px-3 mt-1 bg-white">
        <form onSubmit={handleSearch} className="flex h-11 shadow-sm rounded-xl overflow-hidden border border-gray-200 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-50 transition-all bg-gray-50">
          <div className="flex items-center justify-center w-11 text-gray-400">
            <Icon name="search" size={18} strokeWidth={2.2} />
          </div>
          <input
            name="search"
            placeholder={st("header.searchPlaceholder", "Məhsul, şirkət, gübrə, texnika axtar...")}
            className="flex-1 min-w-0 h-full text-sm bg-transparent focus:outline-none text-gray-800 pr-4"
          />
        </form>
      </div>
    </header>

    <CitySelectModal 
      isOpen={showCityModal} 
      onClose={() => setShowCityModal(false)}
      onSelect={handleCitySelect} 
      currentCity={selectedCity} 
    />
    </>
  );
}
