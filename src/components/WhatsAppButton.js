"use client";
import Icon from "@/components/ui/Icon";

// Click-to-chat WhatsApp button. Uses the platform support number by default,
// or a specific seller/store number when passed in (product page).
// NOTE: this opens a normal WhatsApp chat (wa.me deep link) — it does NOT
// require Meta's paid WhatsApp Business API. To make an AI bot auto-reply
// on WhatsApp (as described in the spec), you need an approved Meta
// WhatsApp Business API number + webhook — see README section "WhatsApp AI".
export default function WhatsAppButton({ phone = "994501234567", message, label = "WhatsApp ilə əlaqə", className = "" }) {
  const text = encodeURIComponent(message || "Salam, FermerMarket üzərindən yazıram.");
  const href = `https://wa.me/${phone}?text=${text}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors ${className}`}
    >
      <Icon name="message" size={16} /> {label}
    </a>
  );
}
