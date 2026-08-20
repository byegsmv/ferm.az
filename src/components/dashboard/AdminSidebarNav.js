"use client";
import React from 'react';
import { Link, usePathname } from "@/i18n/routing";
import Icon from '@/components/ui/Icon';

export default function AdminSidebarNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", icon: "dashboard", label: "Dashboard", exact: true },
    { href: "/admin/products", icon: "package", label: "Məhsullar" },
    { href: "/admin/categories", icon: "folder", label: "Kateqoriyalar" },
    { href: "/admin/orders", icon: "cart", label: "Sifarişlər" },
    { href: "/admin/users", icon: "users", label: "İstifadəçilər" },
    { href: "/admin/campaigns", icon: "megaphone", label: "Kampaniyalar" },
    { href: "/admin/banners", icon: "image", label: "Bannerlər" },
    { href: "/admin/active-ingredients", icon: "flask", label: "Aktiv Maddələr" },
    { href: "/admin/translations", icon: "globe", label: "Tərcümələr" },
    { href: "/admin/settings", icon: "settings", label: "Tənzimləmələr" },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-[var(--border)] flex flex-col shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Icon name="shield" size={18} strokeWidth={2} />
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900 tracking-tight leading-none">Admin Panel</p>
          <p className="text-[11px] text-gray-400 mt-0.5">İdarəetmə Mərkəzi</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 min-h-0 scrollbar-thin">
        {links.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                name={link.icon}
                size={20}
                className={`shrink-0 ${isActive ? 'text-brand-600' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2 : 1.8}
              />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-500">Sistem aktivdir</span>
        </div>
      </div>
    </aside>
  );
}
