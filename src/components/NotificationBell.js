"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import Icon from "@/components/ui/Icon";
import { useSiteTexts } from "@/lib/siteTexts";

const TYPE_ICONS = {
  order_update: "package",
  review_approved: "star",
  message: "message",
  wallet: "wallet",
  system: "bell",
};

export default function NotificationBell() {
  const { t: st } = useSiteTexts();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  function load() {
    setLoading(true);
    apiFetch("/api/notifications?limit=15")
      .then((d) => {
        setNotifs(d.notifications || []);
        setUnread(d.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  // Poll unread count every 30s
  useEffect(() => {
    apiFetch("/api/notifications?unread=1&limit=1")
      .then((d) => setUnread(d.unreadCount || 0))
      .catch(() => {});
    const t = setInterval(() => {
      apiFetch("/api/notifications?unread=1&limit=1")
        .then((d) => setUnread(d.unreadCount || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // Click outside closes
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function toggle() {
    if (!open) { load(); }
    setOpen((v) => !v);
  }

  async function markAllRead() {
    await apiFetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function removeNotif(id) {
    await apiFetch(`/api/notifications/${id}`, { method: "DELETE" }).catch(() => {});
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  function handleClick(notif) {
    if (!notif.isRead) {
      apiFetch(`/api/notifications/${notif.id}`, { method: "PATCH" }).catch(() => {});
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnread((c) => Math.max(0, c - 1));
    }
    if (notif.link) window.location.href = notif.link;
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} className="btn-icon relative" aria-label={st("nav.notificationsAria", "Bildirişlər")}>
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-sm">{st("nav.notificationsTitle", "Bildirişlər")}</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline">
                {st("nav.notificationsMarkAllRead", "Hamısını oxu")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : notifs.length === 0 ? (
              <div className="text-center py-10">
                <Icon name="bellOff" size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">{st("nav.notificationsEmpty", "Bildiriş yoxdur")}</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors ${!n.isRead ? "bg-brand-50" : ""}`}
                >
                  <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon name={TYPE_ICONS[n.type] || "bell"} size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("az-AZ", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeNotif(n.id); }}
                    className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0"
                    aria-label={st("nav.notificationsDeleteAria", "Sil")}
                  ><Icon name="close" size={16} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
