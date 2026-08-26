"use client";

import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/apiClient";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Bugün, ${time}`;
  return d.toLocaleDateString("az-AZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPreview(email) {
  if (!email) return "";
  if (email.bodyText) {
    const firstLine = email.bodyText.trim().split("\n")[0];
    return firstLine.length > 80 ? firstLine.substring(0, 80) + "..." : firstLine;
  }
  if (email.bodyHtml) {
    const stripped = email.bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return stripped.length > 80 ? stripped.substring(0, 80) + "..." : stripped;
  }
  return "Mətn yoxdur";
}

export default function EmailManager() {
  const { toast, ToastContainer } = useToast();

  const [filter, setFilter] = useState("inbox");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, starred: 0, deleted: 0 });

  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/emails/stats");
      setStats({
        total: res.total || 0,
        unread: res.unread || 0,
        starred: res.starred || 0,
        deleted: res.deleted || 0,
      });
    } catch (e) {
      console.error("Failed to fetch email stats:", e);
    }
  }, []);

  // Fetch Emails List
  const fetchEmails = useCallback(async (currentFilter, pageNum) => {
    setLoadingList(true);
    try {
      const res = await apiFetch(
        `/api/admin/emails?filter=${currentFilter}&page=${pageNum}&limit=20`
      );
      setEmails(res.emails || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toast(e.message || "E-poçtları yükləmək mümkün olmadı", "error");
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchEmails(filter, page);
  }, [filter, page, fetchEmails]);

  // Handle Tab Switch
  const handleTabChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setSelectedEmailId(null);
    setSelectedEmail(null);
  };

  // Select Email & Load Detail
  const handleSelectEmail = async (id) => {
    setSelectedEmailId(id);
    setLoadingDetail(true);
    setShowReplyForm(false);
    try {
      const res = await apiFetch(`/api/admin/emails/${id}`);
      const fullEmail = res.email;
      setSelectedEmail(fullEmail);

      // Pre-fill reply subject
      const subjectPrefix = fullEmail.subject?.toLowerCase().startsWith("re:")
        ? fullEmail.subject
        : `Re: ${fullEmail.subject || ""}`;
      setReplySubject(subjectPrefix);
      setReplyBody("");

      // Update unread state in list if it was unread
      setEmails((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      fetchStats();
    } catch (e) {
      toast(e.message || "E-poçt məlumatlarını yükləmək mümkün olmadı", "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Toggle Star
  const handleToggleStar = async (e, emailItem) => {
    if (e) e.stopPropagation();
    const newStarred = !emailItem.isStarred;

    // Optimistic update
    setEmails((prev) =>
      prev.map((item) =>
        item.id === emailItem.id ? { ...item, isStarred: newStarred } : item
      )
    );
    if (selectedEmail && selectedEmail.id === emailItem.id) {
      setSelectedEmail((prev) => ({ ...prev, isStarred: newStarred }));
    }

    try {
      await apiFetch(`/api/admin/emails/${emailItem.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isStarred: newStarred }),
      });
      toast(newStarred ? "Ulduzlandı" : "Ulduz silindi", "success");
      fetchStats();
    } catch (err) {
      toast(err.message || "Xəta baş verdi", "error");
      // Revert
      setEmails((prev) =>
        prev.map((item) =>
          item.id === emailItem.id ? { ...item, isStarred: !newStarred } : item
        )
      );
    }
  };

  // Toggle Read / Unread
  const handleToggleRead = async (emailItem) => {
    const newRead = !emailItem.isRead;
    setEmails((prev) =>
      prev.map((item) =>
        item.id === emailItem.id ? { ...item, isRead: newRead } : item
      )
    );
    if (selectedEmail && selectedEmail.id === emailItem.id) {
      setSelectedEmail((prev) => ({ ...prev, isRead: newRead }));
    }

    try {
      await apiFetch(`/api/admin/emails/${emailItem.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isRead: newRead }),
      });
      fetchStats();
    } catch (err) {
      toast(err.message || "Xəta baş verdi", "error");
    }
  };

  // Soft Delete Email
  const handleDeleteEmail = async (emailItem) => {
    if (!confirm("Bu e-poçtu silmək istədiyinizə əminsiniz?")) return;

    try {
      await apiFetch(`/api/admin/emails/${emailItem.id}`, {
        method: "DELETE",
      });
      toast("E-poçt silindi", "success");

      if (selectedEmailId === emailItem.id) {
        setSelectedEmailId(null);
        setSelectedEmail(null);
      }

      fetchEmails(filter, page);
      fetchStats();
    } catch (err) {
      toast(err.message || "Silmək mümkün olmadı", "error");
    }
  };

  // Send Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) {
      toast("Cavab mətnini daxil edin", "warning");
      return;
    }

    setSendingReply(true);
    try {
      const res = await apiFetch(`/api/admin/emails/${selectedEmail.id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          subject: replySubject,
          body: replyBody,
        }),
      });

      toast("Cavab uğurla göndərildi", "success");
      if (res.email) {
        setSelectedEmail(res.email);
        setEmails((prev) =>
          prev.map((item) =>
            item.id === res.email.id ? { ...item, isReplied: true } : item
          )
        );
      }
      setShowReplyForm(false);
      setReplyBody("");
    } catch (err) {
      toast(err.message || "Cavab göndərmək mümkün olmadı", "error");
    } finally {
      setSendingReply(false);
    }
  };

  // Filter local items by search query
  const filteredEmails = emails.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.subject?.toLowerCase().includes(q) ||
      item.fromEmail?.toLowerCase().includes(q) ||
      item.fromName?.toLowerCase().includes(q) ||
      item.bodyText?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icon name="mail" size={26} className="text-emerald-600" />
            E-poçt İdarəçisi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Daxil olan e-poçtlara baxın, cavablandırın və idarə edin
          </p>
        </div>

        <button
          onClick={() => {
            fetchEmails(filter, page);
            fetchStats();
          }}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm"
        >
          <Icon name="refresh" size={16} />
          Yenilə
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Icon name="inbox" size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Ümumi E-poçt</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Icon name="bell" size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Oxunmamış</p>
            <p className="text-xl font-bold text-gray-900">{stats.unread}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0">
            <Icon name="star" size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Ulduzlu</p>
            <p className="text-xl font-bold text-gray-900">{stats.starred}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => handleTabChange("inbox")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition shrink-0 ${
              filter === "inbox"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon name="inbox" size={16} />
            Hamısı
          </button>

          <button
            onClick={() => handleTabChange("unread")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition shrink-0 ${
              filter === "unread"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon name="bell" size={16} />
            Oxunmamış
            {stats.unread > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  filter === "unread"
                    ? "bg-white text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {stats.unread}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("starred")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition shrink-0 ${
              filter === "starred"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon name="star" size={16} />
            Ulduzlu
          </button>

          <button
            onClick={() => handleTabChange("deleted")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition shrink-0 ${
              filter === "deleted"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon name="trash" size={16} />
            Silinmiş
          </button>
        </div>

        {/* Local Search Input */}
        <div className="relative min-w-[200px] sm:max-w-xs">
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="E-poçtlarda axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Pane: Email List */}
        <div
          className={`col-span-12 md:col-span-5 lg:col-span-4 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${
            selectedEmailId ? "hidden md:block" : "block"
          }`}
        >
          <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Siyahı ({filteredEmails.length})</span>
            {totalPages > 1 && (
              <span>
                Səhifə {page} / {totalPages}
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {loadingList ? (
              <div className="p-4 space-y-3">
                <SkeletonList count={5} />
              </div>
            ) : filteredEmails.length === 0 ? (
              <EmptyState
                icon="mail"
                title="E-poçt tapılmadı"
                subtitle="Bu bölmədə heç bir məktub yoxdur."
              />
            ) : (
              filteredEmails.map((item) => {
                const isSelected = item.id === selectedEmailId;
                const preview = getPreview(item);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectEmail(item.id)}
                    className={`p-4 cursor-pointer transition relative hover:bg-gray-50 ${
                      isSelected
                        ? "bg-emerald-50/60 border-l-4 border-l-emerald-600"
                        : item.isRead
                        ? "bg-white"
                        : "bg-amber-50/30 font-semibold"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {!item.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {item.fromName || item.fromEmail}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.isReplied && (
                          <span className="text-emerald-600" title="Cavablandırılıb">
                            <Icon name="checkCheck" size={14} />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(e, item)}
                          className="text-gray-400 hover:text-amber-500 transition"
                        >
                          <Icon
                            name="star"
                            size={16}
                            className={
                              item.isStarred
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-300"
                            }
                          />
                        </button>
                      </div>
                    </div>

                    <h4
                      className={`text-sm truncate mb-1 ${
                        !item.isRead ? "font-bold text-gray-900" : "font-medium text-gray-800"
                      }`}
                    >
                      {item.subject || "(Mövzusuz)"}
                    </h4>

                    <p className="text-xs text-gray-500 line-clamp-1 mb-2 font-normal">
                      {preview}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>{formatDate(item.receivedAt)}</span>
                      <span className="truncate max-w-[120px]">{item.fromEmail}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Öncəki
              </button>

              <span className="text-xs font-medium text-gray-600">
                {page} / {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Sonrakı
              </button>
            </div>
          )}
        </div>

        {/* Right Pane: Email Detail View */}
        <div
          className={`col-span-12 md:col-span-7 lg:col-span-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 ${
            !selectedEmailId ? "hidden md:block" : "block"
          }`}
        >
          {!selectedEmailId ? (
            <EmptyState
              icon="mail"
              title="E-poçt seçilməyib"
              subtitle="Məzmunu və detalları görmək üçün soldakı siyahıdan bir e-poçt seçin."
            />
          ) : loadingDetail ? (
            <div className="space-y-4 py-8">
              <div className="skeleton h-8 w-3/4 rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-48 w-full rounded-2xl" />
            </div>
          ) : selectedEmail ? (
            <div className="space-y-6">
              {/* Back Button for Mobile */}
              <div className="md:hidden">
                <button
                  onClick={() => setSelectedEmailId(null)}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
                >
                  <Icon name="arrowLeft" size={16} />
                  Siyahıya qayıt
                </button>
              </div>

              {/* Subject & Actions Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-snug">
                    {selectedEmail.subject || "(Mövzusuz)"}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedEmail.isReplied && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <Icon name="check" size={12} /> Cavablandırılıb
                      </span>
                    )}
                    {selectedEmail.isStarred && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Icon name="star" size={12} className="fill-amber-600" /> Ulduzlu
                      </span>
                    )}
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStar(null, selectedEmail)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
                    title={selectedEmail.isStarred ? "Ulduzu sil" : "Ulduzla"}
                  >
                    <Icon
                      name="star"
                      size={18}
                      className={
                        selectedEmail.isStarred
                          ? "text-amber-500 fill-amber-500"
                          : "text-gray-400"
                      }
                    />
                  </button>

                  <button
                    onClick={() => handleToggleRead(selectedEmail)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
                    title={selectedEmail.isRead ? "Oxunmamış kimi qeyd et" : "Oxunmuş kimi qeyd et"}
                  >
                    <Icon name={selectedEmail.isRead ? "bell" : "check"} size={18} />
                  </button>

                  <button
                    onClick={() => handleDeleteEmail(selectedEmail)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Sil"
                  >
                    <Icon name="trash" size={18} />
                  </button>

                  <button
                    onClick={() => setShowReplyForm((prev) => !prev)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
                  >
                    <Icon name="send" size={16} />
                    Cavabla
                  </button>
                </div>
              </div>

              {/* Sender & Metadata Box */}
              <div className="flex items-start gap-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
                  {(selectedEmail.fromName || selectedEmail.fromEmail || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-sm font-bold text-gray-900">
                      {selectedEmail.fromName || "Məlum deyil"}{" "}
                      <span className="font-normal text-gray-500 text-xs">
                        &lt;{selectedEmail.fromEmail}&gt;
                      </span>
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatDate(selectedEmail.receivedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Kuma: <span className="font-medium text-gray-700">{selectedEmail.toEmail}</span>
                  </p>
                </div>
              </div>

              {/* Body Content */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 min-h-[160px]">
                {selectedEmail.bodyHtml ? (
                  <div
                    className="prose max-w-none text-gray-800 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                  />
                ) : (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedEmail.bodyText || "Mətn yoxdur."}
                  </p>
                )}
              </div>

              {/* Previous Reply Display (if already replied) */}
              {selectedEmail.isReplied && selectedEmail.replyBody && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <Icon name="checkCheck" size={14} /> Sizin cavabınız:
                    </span>
                    {selectedEmail.replySentAt && (
                      <span className="text-emerald-600 font-normal">
                        {formatDate(selectedEmail.replySentAt)}
                      </span>
                    )}
                  </div>
                  {selectedEmail.replySubject && (
                    <p className="text-xs font-semibold text-emerald-900">
                      Mövzu: {selectedEmail.replySubject}
                    </p>
                  )}
                  <p className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                    {selectedEmail.replyBody}
                  </p>
                </div>
              )}

              {/* Reply Form */}
              {showReplyForm && (
                <form
                  onSubmit={handleSendReply}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Icon name="send" size={16} className="text-emerald-600" />
                      Cavab məktubu yazın
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <Icon name="close" size={18} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Mövzu
                    </label>
                    <input
                      type="text"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Mövzu..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cavab Mətni *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Cavabınızı bura daxil edin..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition"
                    >
                      Ləğv et
                    </button>

                    <button
                      type="submit"
                      disabled={sendingReply}
                      className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition disabled:opacity-50"
                    >
                      {sendingReply ? (
                        <>
                          <Icon name="refresh" size={14} className="animate-spin" />
                          Göndərilir...
                        </>
                      ) : (
                        <>
                          <Icon name="send" size={14} />
                          Cavabı Göndər
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <EmptyState icon="alert" title="E-poçt tapılmadı" />
          )}
        </div>
      </div>
    </div>
  );
}
