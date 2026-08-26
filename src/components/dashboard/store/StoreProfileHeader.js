"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";

export default function StoreProfileHeader({ store, user, onEdit, stats }) {
  const [coverUrl, setCoverUrl] = useState(store?.coverUrl || "");
  const [logoUrl, setLogoUrl] = useState(store?.logoUrl || "");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const coverInputRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (store?.coverUrl) setCoverUrl(store.coverUrl);
    if (store?.logoUrl) setLogoUrl(store.logoUrl);
  }, [store?.coverUrl, store?.logoUrl]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  }

  // Handle Cover Upload
  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const uploadRes = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const newCoverUrl = uploadRes?.images?.[0]?.url || uploadRes?.url;
      if (!newCoverUrl) throw new Error("Yüklənmə uğursuz oldu");

      await apiFetch("/api/stores/me", {
        method: "PATCH",
        body: JSON.stringify({ coverUrl: newCoverUrl }),
      });

      setCoverUrl(newCoverUrl);
      showToast("Kover şəkli uğurla yeniləndi!");
    } catch (err) {
      console.error("Cover upload error:", err);
      showToast(err.message || "Kover şəkli yüklənərkən xəta baş verdi");
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  // Handle Logo Upload
  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const uploadRes = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const newLogoUrl = uploadRes?.images?.[0]?.url || uploadRes?.url;
      if (!newLogoUrl) throw new Error("Yüklənmə uğursuz oldu");

      await apiFetch("/api/stores/me", {
        method: "PATCH",
        body: JSON.stringify({ logoUrl: newLogoUrl }),
      });

      setLogoUrl(newLogoUrl);
      showToast("Loqo uğurla yeniləndi!");
    } catch (err) {
      console.error("Logo upload error:", err);
      showToast(err.message || "Loqo yüklənərkən xəta baş verdi");
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  // Share action
  function handleShare() {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/stores/${store?.slug || store?.id || ""}`
        : "";

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: store?.name || "Mağaza",
          text: store?.description || "FermerMarket Mağazası",
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  }

  // Copy link action
  function handleCopyLink() {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/stores/${store?.slug || store?.id || ""}`
        : "";

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl);
      showToast("Mağaza keçidi kopyalandı!");
    }
  }

  // Derived values & formatting
  const displayCoverUrl = coverUrl || store?.coverUrl;
  const displayLogoUrl = logoUrl || store?.logoUrl;

  const storeViewCount = stats?.totalViews ?? store?.storeViewCount ?? 0;
  const followerCount = stats?.followerCount ?? store?.followerCount ?? 0;
  const totalSales = stats?.totalSales ?? store?.totalSales ?? 0;

  const rawRating = stats?.averageRating ?? store?.avgRating ?? 0;
  const avgRatingFormatted =
    typeof rawRating === "number"
      ? rawRating.toFixed(1)
      : Number(rawRating || 0).toFixed(1);

  const memberSince = store?.createdAt
    ? new Date(store.createdAt).toLocaleDateString("az-AZ", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-bounce">
          <Icon name="checkCircle" size={18} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Profile Header Main Box */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
        {/* 1. COVER BANNER */}
        <div className="relative w-full h-[180px] md:h-[240px] overflow-hidden group">
          {displayCoverUrl ? (
            <img
              src={displayCoverUrl}
              alt={store?.name || "Kover şəkli"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-600 via-green-500 to-emerald-600 flex items-center justify-center p-4">
              <span className="text-white/25 text-3xl md:text-5xl font-black uppercase tracking-widest select-none text-center">
                {store?.name || "Fermer Market"}
              </span>
            </div>
          )}

          {/* Gradient Overlay at Bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

          {/* Cover Camera Button */}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover}
            title="Kover şəklini dəyişdir"
            className="absolute top-3 right-3 md:top-4 md:right-4 z-10 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer disabled:opacity-60"
          >
            {isUploadingCover ? (
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="camera" size={18} className="text-gray-700" />
            )}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>

        {/* Content Section below cover */}
        <div className="p-4 md:p-6 pt-0 relative">
          {/* Top Row: Logo & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-14 mb-4">
            {/* 2. STORE LOGO */}
            <div className="relative shrink-0 self-start md:self-auto">
              <div className="w-[72px] h-[72px] md:w-[96px] md:h-[96px] rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-white relative flex items-center justify-center border border-gray-100">
                {displayLogoUrl ? (
                  <img
                    src={displayLogoUrl}
                    alt={store?.name || "Mağaza loqosu"}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-500 to-emerald-700 text-white font-black text-2xl md:text-4xl flex items-center justify-center uppercase">
                    {(store?.name || "M")[0]}
                  </div>
                )}
              </div>

              {/* Camera Icon Overlay on Logo */}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                title="Loqonu dəyişdir"
                className="absolute bottom-0 right-0 z-10 p-1.5 md:p-2 bg-white text-gray-700 rounded-full shadow-md hover:bg-brand-50 hover:text-brand-600 transition-all cursor-pointer ring-2 ring-white disabled:opacity-60"
              >
                {isUploadingLogo ? (
                  <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="camera" size={14} />
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {/* 5. QUICK ACTIONS (Desktop Right-Aligned) */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              <QuickActionsButtons
                onEdit={onEdit}
                onShare={handleShare}
                onCopy={handleCopyLink}
                slug={store?.slug || store?.id}
              />
            </div>
          </div>

          {/* 3. STORE INFO */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  {store?.name || "Adsız Mağaza"}
                </h1>

                {/* Verified Badge */}
                {store?.isVerified && (
                  <span
                    className="inline-flex items-center text-blue-500"
                    title="Təsdiqlənmiş Mağaza"
                  >
                    <Icon
                      name="checkCircle"
                      size={20}
                      className="fill-blue-500 text-white shrink-0"
                    />
                  </span>
                )}

                {/* Crown / Subscription Badge */}
                {(store?.subscription || user?.subscription || store?.isPremium) && (
                  <span
                    className="inline-flex items-center text-amber-500"
                    title="Premium Mağaza"
                  >
                    <Icon
                      name="crown"
                      size={18}
                      className="fill-amber-400 text-amber-600 shrink-0"
                    />
                  </span>
                )}

                {/* Static Category Label */}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                  Kənd Təsərrüfatı Məhsulları
                </span>
              </div>

              {/* Slug */}
              {store?.slug && (
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  @{store.slug}
                </p>
              )}
            </div>

            {/* Bio / Description */}
            {store?.description && (
              <div className="text-sm text-gray-600 max-w-3xl leading-relaxed">
                <p className={isBioExpanded ? "" : "line-clamp-2"}>
                  {store.description}
                </p>
                {store.description.length > 110 && (
                  <button
                    type="button"
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    {isBioExpanded ? "Daha az göstər" : "Ətraflı oxu"}
                    <Icon
                      name={isBioExpanded ? "arrowUp" : "chevronDown"}
                      size={12}
                    />
                  </button>
                )}
              </div>
            )}

            {/* Inline Stats Row */}
            <div className="flex items-center gap-3 md:gap-4 text-xs font-medium text-gray-500 flex-wrap pt-1 border-t border-gray-50">
              <span className="flex items-center gap-1">
                <Icon name="eye" size={14} className="text-gray-400" />
                <strong className="text-gray-800">{formatNumber(storeViewCount)}</strong> Baxış
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <Icon name="users" size={14} className="text-gray-400" />
                <strong className="text-gray-800">{formatNumber(followerCount)}</strong> İzləyici
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <Icon name="star" size={14} className="text-amber-500 fill-amber-400" />
                <strong className="text-gray-800">{avgRatingFormatted}</strong> Reytinq
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <Icon name="dollar" size={14} className="text-emerald-600" />
                <strong className="text-gray-800">{formatNumber(totalSales)}</strong> Satış
              </span>
              {memberSince && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <Icon name="calendar" size={14} className="text-gray-400" />
                    <span>{memberSince} dən üzv</span>
                  </span>
                </>
              )}
            </div>

            {/* 4. CONTACT + SOCIAL BAR */}
            <SocialContactBar store={store} />

            {/* 5. QUICK ACTIONS (Mobile Below) */}
            <div className="flex md:hidden items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
              <QuickActionsButtons
                onEdit={onEdit}
                onShare={handleShare}
                onCopy={handleCopyLink}
                slug={store?.slug || store?.id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. STATS CARDS */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard
          icon="package"
          iconBg="bg-blue-50 text-blue-600"
          value={stats?.totalProducts ?? 0}
          label="Total Ürün"
        />
        <StatCard
          icon="checkCircle"
          iconBg="bg-emerald-50 text-emerald-600"
          value={stats?.activeProducts ?? 0}
          label="Aktif Elan"
        />
        <StatCard
          icon="eye"
          iconBg="bg-indigo-50 text-indigo-600"
          value={stats?.totalViews ?? store?.storeViewCount ?? 0}
          label="Baxış"
        />
        <StatCard
          icon="users"
          iconBg="bg-purple-50 text-purple-600"
          value={stats?.followerCount ?? store?.followerCount ?? 0}
          label="İzləyici"
        />
        <StatCard
          icon="trendingUp"
          iconBg="bg-amber-50 text-amber-600"
          value={stats?.totalSales ?? store?.totalSales ?? 0}
          label="Satış"
        />
        <StatCard
          icon="star"
          iconBg="bg-yellow-50 text-yellow-500"
          value={avgRatingFormatted}
          label="Reytinq"
        />
      </div>
    </div>
  );
}

// 4. Contact & Social Bar Helper
function SocialContactBar({ store }) {
  const phone = store?.phone || "";
  const whatsapp = store?.whatsapp || "";
  const email = store?.email || "";
  const website = store?.website || "";
  const facebook = store?.facebook || "";
  const instagram = store?.instagram || "";
  const tiktok = store?.tiktok || "";
  const linkedin = store?.linkedin || "";
  const youtube = store?.youtube || "";
  const telegram = store?.telegram || "";
  const address = store?.address || "";

  const hasAnyLink =
    phone ||
    whatsapp ||
    email ||
    website ||
    facebook ||
    instagram ||
    tiktok ||
    linkedin ||
    youtube ||
    telegram ||
    address;

  if (!hasAnyLink) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap pt-2">
      {/* Phone */}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <Icon name="phone" size={13} className="text-emerald-600" />
          <span>{phone}</span>
        </a>
      )}

      {/* WhatsApp */}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <Icon name="message" size={13} className="text-emerald-500" />
          <span>WhatsApp</span>
        </a>
      )}

      {/* Email */}
      {email && (
        <a
          href={`mailto:${email}`}
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <Icon name="mail" size={13} className="text-blue-500" />
          <span>{email}</span>
        </a>
      )}

      {/* Website */}
      {website && (
        <a
          href={website.startsWith("http") ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <Icon name="globe" size={13} className="text-indigo-500" />
          <span>Veb-sayt</span>
        </a>
      )}

      {/* Facebook */}
      {facebook && (
        <a
          href={facebook.startsWith("http") ? facebook : `https://facebook.com/${facebook}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <IconFacebook className="w-3.5 h-3.5 fill-[#1877F2]" />
          <span>Facebook</span>
        </a>
      )}

      {/* Instagram */}
      {instagram && (
        <a
          href={
            instagram.startsWith("http")
              ? instagram
              : `https://instagram.com/${instagram.replace(/^@/, "")}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <IconInstagram className="w-3.5 h-3.5 text-[#E4405F]" />
          <span>Instagram</span>
        </a>
      )}

      {/* TikTok */}
      {tiktok && (
        <a
          href={
            tiktok.startsWith("http")
              ? tiktok
              : `https://tiktok.com/@${tiktok.replace(/^@/, "")}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <IconTikTok className="w-3.5 h-3.5 fill-gray-900" />
          <span>TikTok</span>
        </a>
      )}

      {/* LinkedIn */}
      {linkedin && (
        <a
          href={
            linkedin.startsWith("http")
              ? linkedin
              : `https://linkedin.com/in/${linkedin}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <IconLinkedIn className="w-3.5 h-3.5 fill-[#0A66C2]" />
          <span>LinkedIn</span>
        </a>
      )}

      {/* YouTube */}
      {youtube && (
        <a
          href={
            youtube.startsWith("http")
              ? youtube
              : `https://youtube.com/${youtube.startsWith("@") ? youtube : "@" + youtube}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <IconYouTube className="w-3.5 h-3.5 fill-[#FF0000]" />
          <span>YouTube</span>
        </a>
      )}

      {/* Telegram */}
      {telegram && (
        <a
          href={
            telegram.startsWith("http")
              ? telegram
              : `https://t.me/${telegram.replace(/^@/, "")}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 transition-colors border border-gray-100"
        >
          <IconTelegram className="w-3.5 h-3.5 fill-[#24A1DE]" />
          <span>Telegram</span>
        </a>
      )}

      {/* Address */}
      {address && (
        <span className="bg-gray-50 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 border border-gray-100">
          <Icon name="mapPin" size={13} className="text-red-500" />
          <span>{address}</span>
        </span>
      )}
    </div>
  );
}

// 5. Quick Actions Buttons
function QuickActionsButtons({ onEdit, onShare, onCopy, slug }) {
  return (
    <>
      {/* Profili Düzəlt */}
      <button
        type="button"
        onClick={() => onEdit && onEdit()}
        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs md:text-sm px-3.5 py-2 rounded-xl shadow-sm shadow-brand-200 flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Icon name="pencil" size={15} />
        <span>Profili Düzəlt</span>
      </button>

      {/* Paylaş */}
      <button
        type="button"
        onClick={onShare}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs md:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Icon name="share" size={15} />
        <span>Paylaş</span>
      </button>

      {/* Mağazaya Get */}
      {slug ? (
        <Link
          href={`/stores/${slug}`}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs md:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Icon name="store" size={15} />
          <span>Mağazaya Get</span>
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="bg-gray-100 text-gray-400 font-semibold text-xs md:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-not-allowed opacity-60"
        >
          <Icon name="store" size={15} />
          <span>Mağazaya Get</span>
        </button>
      )}

      {/* Linki Kopyala */}
      <button
        type="button"
        onClick={onCopy}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs md:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Icon name="copy" size={15} />
        <span>Linki Kopyala</span>
      </button>
    </>
  );
}

// 6. Stat Card Item
function StatCard({ icon, iconBg, value, label }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3.5 md:p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center group">
      <div
        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${iconBg}`}
      >
        <Icon name={icon} size={18} />
      </div>
      <span className="text-base md:text-lg font-black text-gray-900 tracking-tight leading-none mb-1">
        {typeof value === "number" ? formatNumber(value) : value}
      </span>
      <span className="text-[11px] md:text-xs font-medium text-gray-500">
        {label}
      </span>
    </div>
  );
}

// Helper: Number formatter
function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  if (typeof num !== "number") num = Number(num) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toLocaleString("az-AZ");
}

// SVG Icons for Social Media
function IconFacebook({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconInstagram({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function IconTikTok({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-1.22v-3.5a6.34 6.34 0 0 0-5.06 2.5 6.34 6.34 0 0 0 8.8 8.65 6.34 6.34 0 0 0 2.61-5.11V8.41a8.28 8.28 0 0 0 4.76 1.78v-3.5a4.84 4.84 0 0 1-1-.05z" />
    </svg>
  );
}

function IconLinkedIn({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function IconYouTube({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconTelegram({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.128.832.942z" />
    </svg>
  );
}
