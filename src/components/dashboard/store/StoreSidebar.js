"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

const NAVIGATION_SECTIONS = [
  {
    title: "ÜMUMİ",
    items: [
      { id: "overview", label: "Ümumi baxış", icon: "dashboard" },
      { id: "products", label: "Məhsullar", icon: "package" },
      { id: "orders", label: "Sifarişlər", icon: "cart" },
      { id: "messages", label: "Mesajlar", icon: "message" },
      { id: "reviews", label: "Rəylər", icon: "star" },
      { id: "favorites", label: "Seçilmişlər", icon: "heart" },
      { id: "coupons", label: "Kuponlar", icon: "percent" },
    ],
  },
  {
    title: "MARKETİNG",
    items: [
      { id: "analytics", label: "Analitika", icon: "barChart" },
      { id: "settings", label: "Tənzimləmələr", icon: "settings" },
      { id: "subscription", label: "Paketlər", icon: "crown" },
    ],
  },
  {
    title: "MƏBLƏĞ",
    items: [
      { id: "wallet", label: "Balans & Kisə", icon: "wallet" },
      { id: "invoices", label: "Hesab-fakturalar", icon: "fileText" },
    ],
  },
  {
    title: "HESAB",
    items: [
      { id: "notifications", label: "Bildirişlər", icon: "bell" },
      { id: "support", label: "Dəstək & Yardım", icon: "info" },
      { id: "security", label: "Təhlükəsizlik", icon: "shield" },
      { id: "logout", label: "Çıxış", icon: "logout" },
    ],
  },
];

export default function StoreSidebar({
  activeTab = "overview",
  onTabChange,
  store,
  user,
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function handleSelectTab(tabId) {
    if (onTabChange) onTabChange(tabId);
    setIsMobileOpen(false);
  }

  const storeName = store?.name || user?.fullName || "Mağazam";
  const storeLogo = store?.logoUrl || user?.avatarUrl;

  const sidebarContent = (
    <div className="space-y-6">
      {/* STORE MINI-CARD */}
      <div className="bg-gradient-to-br from-brand-50 to-emerald-50/50 p-3.5 rounded-2xl border border-brand-100 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white border border-brand-200 overflow-hidden shrink-0 flex items-center justify-center font-black text-brand-700 text-lg shadow-sm">
          {storeLogo ? (
            <img
              src={storeLogo}
              alt={storeName}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : (
            storeName[0]?.toUpperCase() || "M"
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-extrabold text-gray-900 truncate">
              {storeName}
            </h3>
            {store?.isVerified && (
              <Icon
                name="checkCircle"
                size={14}
                className="text-emerald-500 shrink-0"
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold bg-brand-600 text-white rounded-md uppercase tracking-wider">
              {store?.plan || "PRO"}
            </span>
            <span className="text-[10px] text-gray-500 truncate">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION SECTIONS */}
      <div className="space-y-5">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {section.title}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-brand-50 text-brand-700 font-bold shadow-sm border-l-4 border-brand-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      size={17}
                      className={isActive ? "text-brand-600" : "text-gray-400"}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm h-fit self-start sticky top-6">
        {sidebarContent}
      </aside>

      {/* MOBILE HEADER BUTTON FOR DRAWER */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm font-bold text-xs text-gray-800 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Icon name="dashboard" size={18} className="text-brand-600" />
            <span>Mağaza Menyusu</span>
          </div>
          <Icon name="chevronDown" size={16} className="text-gray-500" />
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full p-4 overflow-y-auto shadow-2xl z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                <span className="font-extrabold text-sm text-gray-900">
                  Mağaza Panel
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
