'use client';

import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';

export default function ShareButtons({ product }) {
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      alert('Keçid kopyalandı!');
    }
  };

  const whatsappText = `${product.titleAz} — ${shareUrl}`;

  return (
    <div className="flex items-center gap-3 mt-6">
      <p className="text-sm font-medium text-gray-600">Paylaş:</p>
      <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer"
         className="w-9 h-9 rounded-xl bg-green-500 text-white flex items-center justify-center text-sm font-bold hover:bg-green-600">W</a>
      <button onClick={handleCopy}
         className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200" aria-label="Keçidi kopyala"><Icon name="link" size={16} /></button>
    </div>
  );
}
