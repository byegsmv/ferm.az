'use client';

import { useEffect } from 'react';

export default function GlobalError({ error }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-extrabold text-red-600 mb-4">Sistemdə Xəta</h1>
            <p className="text-gray-600">Gözlənilməz bir xəta baş verdi. Zəhmət olmasa biraz sonra yenidən cəhd edin.</p>
          </div>
        </div>
      </body>
    </html>
  );
}
