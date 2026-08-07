"use client";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { apiFetch, getUser } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";
import { useSiteTexts } from "@/lib/siteTexts";

function NavItem({ href, label, icon, active, badge }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors duration-150 min-w-0 ${
        active ? "text-brand-600" : "text-gray-400 hover:text-gray-600"
      }`}
    >
      <span className="leading-none transition-transform duration-200">
        <Icon name={icon} size={22} strokeWidth={active ? 2.2 : 1.8} />
      </span>
      <span className="text-[10px] font-medium leading-none whitespace-nowrap truncate max-w-full px-0.5">
        {label}
      </span>
      {badge > 0 && (
        <span className="absolute top-1 right-3 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

export default function BottomNav() {
  const { t: st } = useSiteTexts();
  const pathname = usePathname();
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getUser();
    setIsLoggedIn(!!user);
    if (user) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  async function fetchUnread() {
    try {
      const data = await apiFetch("/api/conversations/unread");
      setUnreadMsg(data.count || 0);
    } catch {}
  }

  if (!mounted) return null;

  const leftItems = [
    { href: "/",           label: st("nav.home", "Əsas"),        icon: "home" },
    { href: "/favorites",  label: st("nav.favorites", "Seçilmiş"), icon: "heart" },
  ];
  const rightItems = isLoggedIn
    ? [
        { href: "/messages",  label: st("nav.messages", "Mesajlar"), icon: "message", badge: unreadMsg },
        { href: "/dashboard", label: st("nav.profile", "Profil"),   icon: "user" },
      ]
    : [
        { href: "/products",  label: st("nav.catalog", "Kataloq"),  icon: "dashboard" },
        { href: "/login",     label: st("nav.login", "Giriş"),    icon: "user" },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
      <div
        className="flex items-stretch h-16 relative"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Sol 2 buton — bərabər flex-1 */}
        {leftItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={item.href === "/" ? pathname === "/" : pathname.includes(item.href)}
          />
        ))}

        {/* Mərkəz FAB — sabit en, flex-shrink-0 */}
        <div className="flex-shrink-0 w-[68px] flex flex-col items-center justify-center relative">
          <Link
            href="/elan-yerlesdir"
            aria-label={st("nav.postAdAria", "Elan yerləşdir")}
            className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 border-[3px] border-white transition-all duration-200 -mt-6"
          >
            <Icon name="plus" size={24} strokeWidth={2.8} />
          </Link>
          <span className="text-[9px] font-bold text-brand-600 leading-none mt-1">{st("nav.sell", "Sat")}</span>
        </div>

        {/* Sağ 2 buton — bərabər flex-1 */}
        {rightItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname.includes(item.href)}
            badge={item.badge || 0}
          />
        ))}
      </div>
    </nav>
  );
}
