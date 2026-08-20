"use client";
import { useEffect, useRef } from "react";
import SafeImage from "@/components/SafeImage";
import { sanitizeAdCode } from "@/lib/security/adSanitizer";

/**
 * Renders a single resolved ad placement (see lib/adSlots.js#getAdSlotContent).
 * - internal: our own Campaign banner — fires impression on mount, click on click.
 * - external: an admin-pasted network embed (e.g. Google AdSense/Ad Manager tag).
 *   dangerouslySetInnerHTML alone won't execute <script> tags, so we manually
 *   re-create and re-append any script nodes found in the snippet to force
 *   the browser to run them (standard workaround for injecting 3rd-party ad tags).
 */
export default function AdBanner({ content, className = "", imgClassName = "w-full h-auto", label }) {
  const externalRef = useRef(null);

  useEffect(() => {
    if (content?.mode === "internal" && content.campaign?.id) {
      fetch(`/api/campaigns/${content.campaign.id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "impression" }),
      }).catch(() => {});
    }
  }, [content]);

  useEffect(() => {
    if (content?.mode !== "external" || !externalRef.current) return;
    const container = externalRef.current;
    const cleanCode = sanitizeAdCode(content.externalCode);
    container.innerHTML = cleanCode;
    // Re-execute any <script> tags — innerHTML assignment does not run them
    container.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.text = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
  }, [content]);

  if (!content) return null;

  function trackClick() {
    if (content.mode === "internal" && content.campaign?.id) {
      fetch(`/api/campaigns/${content.campaign.id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "click" }),
      }).catch(() => {});
    }
  }

  if (content.mode === "external") {
    return (
      <div className={className}>
        {label && <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{label}</p>}
        <div ref={externalRef} />
      </div>
    );
  }

  const { campaign } = content;
  return (
    <div className={className}>
      {label && <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{label}</p>}
      <a
        href={campaign.targetUrl}
        onClick={trackClick}
        className="block rounded-2xl overflow-hidden relative"
        title={campaign.storeName ? `${campaign.title} — ${campaign.storeName}` : campaign.title}
      >
        <span className="absolute top-2 left-2 z-10 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
          Sponsorlu
        </span>
        {campaign.bannerUrl ? <SafeImage src={campaign.bannerUrl} alt={campaign.title} width={1200} height={300} className={imgClassName} /> : <div className={`bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl flex items-center justify-center ${imgClassName}`}><span className="text-white font-bold text-lg px-4 text-center">{campaign.title}</span></div>}
      </a>
    </div>
  );
}
