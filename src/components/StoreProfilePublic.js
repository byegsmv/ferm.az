"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import SafeImage from "@/components/SafeImage";
import { Link } from "@/i18n/routing";
import FollowStoreButton from "@/components/FollowStoreButton";
import StoreShareActions from "@/components/StoreShareActions";
import StoreWorkingHours from "@/components/StoreWorkingHours";
import {
  IconFacebook,
  IconInstagram,
  IconTikTok,
  IconLinkedIn,
  IconYouTube,
  IconTelegram,
  IconWhatsApp,
} from "@/components/SocialIcons";

/**
 * Format social links to ensure a valid external URL
 */
function formatSocialUrl(handleOrUrl, platform) {
  if (!handleOrUrl) return "";
  const trimmed = handleOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, "");
  switch (platform) {
    case "facebook":
      return `https://facebook.com/${clean}`;
    case "instagram":
      return `https://instagram.com/${clean}`;
    case "tiktok":
      return `https://tiktok.com/@${clean}`;
    case "linkedin":
      return `https://linkedin.com/in/${clean}`;
    case "youtube":
      return `https://youtube.com/${trimmed.startsWith("@") ? trimmed : "@" + clean}`;
    case "telegram":
      return `https://t.me/${clean}`;
    case "whatsapp":
      return `https://wa.me/${clean.replace(/[^\d]/g, "")}`;
    default:
      return `https://${clean}`;
  }
}

export default function StoreProfilePublic({
  store = {},
  stats = {},
  isOwner = false,
  isFollowing = false,
  storeUrl = "",
}) {
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const description = store?.description || "";
  const shouldTruncate = description.length > 160;

  // Clean WhatsApp / Phone number for wa.me link
  const cleanWaPhone = (store?.whatsapp || store?.phone || "").replace(/[^\d]/g, "");

  // Format website URL
  let formattedWebsite = "";
  let displayWebsite = "";
  if (store?.website) {
    formattedWebsite =
      store.website.startsWith("http://") || store.website.startsWith("https://")
        ? store.website
        : `https://${store.website}`;
    displayWebsite = store.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  // Stats array configuration (6 pills)
  const statItems = [
    {
      label: "Reytinq",
      value: stats?.rating ? Number(stats.rating).toFixed(1) : "0.0",
      icon: "star",
      iconClass: "text-amber-500 fill-amber-400",
    },
    {
      label: "Məhsullar",
      value: stats?.activeProducts ?? 0,
      icon: "package",
      iconClass: "text-brand-600",
    },
    {
      label: "Satışlar",
      value: stats?.totalSales ?? 0,
      icon: "trendingUp",
      iconClass: "text-emerald-600",
    },
    {
      label: "Baxış",
      value: stats?.viewCount ?? 0,
      icon: "eye",
      iconClass: "text-blue-600",
    },
    {
      label: "İzləyici",
      value: stats?.followerCount ?? 0,
      icon: "users",
      iconClass: "text-purple-600",
    },
    {
      label: "Qeydiyyat",
      value: stats?.memberSince ?? "—",
      icon: "calendar",
      iconClass: "text-gray-500",
    },
  ];

  // Social media channels list
  const socialLinks = [];
  if (store?.facebook) {
    socialLinks.push({
      name: "Facebook",
      url: formatSocialUrl(store.facebook, "facebook"),
      IconComponent: IconFacebook,
      iconClass: "text-[#1877F2]",
      hoverClass: "hover:bg-blue-50 hover:border-blue-200",
    });
  }
  if (store?.instagram) {
    socialLinks.push({
      name: "Instagram",
      url: formatSocialUrl(store.instagram, "instagram"),
      IconComponent: IconInstagram,
      iconClass: "text-[#E4405F]",
      hoverClass: "hover:bg-pink-50 hover:border-pink-200",
    });
  }
  if (store?.tiktok) {
    socialLinks.push({
      name: "TikTok",
      url: formatSocialUrl(store.tiktok, "tiktok"),
      IconComponent: IconTikTok,
      iconClass: "text-gray-900",
      hoverClass: "hover:bg-gray-200 hover:border-gray-300",
    });
  }
  if (store?.linkedin) {
    socialLinks.push({
      name: "LinkedIn",
      url: formatSocialUrl(store.linkedin, "linkedin"),
      IconComponent: IconLinkedIn,
      iconClass: "text-[#0A66C2]",
      hoverClass: "hover:bg-blue-50 hover:border-blue-200",
    });
  }
  if (store?.youtube) {
    socialLinks.push({
      name: "YouTube",
      url: formatSocialUrl(store.youtube, "youtube"),
      IconComponent: IconYouTube,
      iconClass: "text-[#FF0000]",
      hoverClass: "hover:bg-red-50 hover:border-red-200",
    });
  }
  if (store?.telegram) {
    socialLinks.push({
      name: "Telegram",
      url: formatSocialUrl(store.telegram, "telegram"),
      IconComponent: IconTelegram,
      iconClass: "text-[#229ED9]",
      hoverClass: "hover:bg-sky-50 hover:border-sky-200",
    });
  }

  const hasContactInfo =
    store?.phone || cleanWaPhone || store?.email || store?.website || socialLinks.length > 0;

  return (
    <div className="card">
      {/* 1. Cover Banner */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[3/1] max-h-72 overflow-hidden bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700">
        {store?.coverUrl && (
          <SafeImage
            src={store.coverUrl}
            alt={store.name || "Cover"}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Header Row: Logo, Store Name, Badges, Slug & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 pb-2 border-b border-gray-100">
          <div className="flex items-end gap-3 sm:gap-4">
            {/* 2. Logo */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden flex-shrink-0 z-10 flex items-center justify-center">
              {store?.logoUrl ? (
                <SafeImage
                  src={store.logoUrl}
                  alt={store.name || "Logo"}
                  fill
                  className="object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-600">
                  <Icon name="store" size={36} />
                </div>
              )}
            </div>

            {/* 3. Store Name, Badges, Slug */}
            <div className="pt-2 sm:pt-0 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 truncate">
                  {store?.name || "Mağaza"}
                </h1>
                {store?.isVerified && (
                  <span
                    title="Təsdiqlənmiş Mağaza"
                    className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  >
                    <Icon name="checkCircle" size={14} className="fill-brand-100 text-brand-600" />
                    Təsdiqlənib
                  </span>
                )}
                {stats?.isPremium && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
                    <Icon name="crown" size={13} className="text-amber-600 fill-amber-500" />
                    Premium
                  </span>
                )}
                {store?.isActive === false && (
                  <span className="inline-flex items-center gap-1 bg-red-100 border border-red-200 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
                    <Icon name="ban" size={12} className="text-red-600" />
                    Deaktiv
                  </span>
                )}
              </div>
              {store?.slug && (
                <p className="text-sm text-gray-500 font-medium mt-0.5">@{store.slug}</p>
              )}
            </div>
          </div>

          {/* 4. Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-end mt-2 sm:mt-0">
            {isOwner ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2 rounded-full transition-colors shadow-sm"
              >
                <Icon name="settings" size={16} />
                Mağazanı İdarə Et
              </Link>
            ) : (
              <FollowStoreButton
                storeId={store?.id}
                initialFollowing={isFollowing}
                initialCount={stats?.followerCount || 0}
              />
            )}
            <StoreShareActions storeName={store?.name || "Mağaza"} storeUrl={storeUrl || ""} />
          </div>
        </div>

        {/* 5. Bio Description */}
        {description && (
          <div>
            <p className="whitespace-pre-line text-sm text-gray-600 leading-relaxed">
              {shouldTruncate && !isBioExpanded
                ? `${description.slice(0, 160)}...`
                : description}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 mt-1 focus:outline-none"
              >
                <span>{isBioExpanded ? "Daha az" : "Daha çox"}</span>
                <Icon
                  name="chevronDown"
                  size={14}
                  className={`transition-transform duration-200 ${
                    isBioExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        )}

        {/* 6. Stats Grid (6 Pills) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {statItems.map((stat, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-xl py-3 px-2 text-center border border-gray-100 flex flex-col items-center justify-center transition-all hover:bg-gray-100/80"
            >
              <div className="inline-flex items-center gap-1 text-gray-900 font-black text-sm sm:text-base">
                <Icon name={stat.icon} size={16} className={stat.iconClass} />
                <span>{stat.value}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* 7. Contact Row & Social Media Icons */}
        {hasContactInfo && (
          <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-gray-100">
            {/* Contact Pill Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {store?.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-700 transition-colors"
                >
                  <Icon name="phone" size={14} className="text-brand-600" />
                  <span>{store.phone}</span>
                </a>
              )}
              {cleanWaPhone && (
                <a
                  href={`https://wa.me/${cleanWaPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 transition-colors"
                >
                  <IconWhatsApp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              )}
              {store?.email && (
                <a
                  href={`mailto:${store.email}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-700 transition-colors"
                >
                  <Icon name="mail" size={14} className="text-blue-600" />
                  <span>{store.email}</span>
                </a>
              )}
              {store?.website && (
                <a
                  href={formattedWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-700 transition-colors"
                >
                  <Icon name="globe" size={14} className="text-indigo-600" />
                  <span>{displayWebsite}</span>
                </a>
              )}
            </div>

            {/* Social Media Buttons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-1.5">
                {socialLinks.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.name}
                    className={`w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center transition-colors ${s.hoverClass}`}
                  >
                    <s.IconComponent className={`w-4 h-4 ${s.iconClass}`} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. Address & Working Hours */}
        {(store?.address || store?.workingHours) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {store?.address && (
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 flex items-start gap-2.5 text-sm text-gray-700">
                <Icon name="mapPin" size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider mb-0.5">
                    Ünvan
                  </span>
                  <span className="font-medium text-gray-800">{store.address}</span>
                </div>
              </div>
            )}
            {store?.workingHours && (
              <StoreWorkingHours workingHours={store.workingHours} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
