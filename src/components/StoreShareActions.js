"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function StoreShareActions({ storeName, storeUrl }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: storeName, url: storeUrl });
        return;
      } catch {
        // user cancelled or share unsupported — fall through to copy
      }
    }
    handleCopy();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — no-op, user can copy from address bar
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-700 transition-colors"
      >
        <Icon name="share" size={14} />
        Paylaş
      </button>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-700 transition-colors"
      >
        <Icon name={copied ? "checkCircle" : "copy"} size={14} className={copied ? "text-brand-600" : ""} />
        {copied ? "Kopyalandı!" : "Linki kopyala"}
      </button>
    </div>
  );
}
