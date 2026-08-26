'use client';

import React, { useState, useRef } from 'react';
import { Upload, Link, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';

export default function ImageUploadField({
  label = "Logo / Şəkil",
  value = "",
  onChange,
  placeholder = "https://example.com/image.png",
  required = false
}) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Fayl ölçüsü maksimum 5MB ola bilər');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Şəkil yüklənmədi');
      }

      if (data.images && data.images.length > 0) {
        onChange(data.images[0].url);
      }
    } catch (err) {
      setError(err.message || 'Yükləmə xətası baş verdi');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              mode === 'upload' ? 'bg-white text-brand-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Fayl Yüklə
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              mode === 'url' ? 'bg-white text-brand-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            URL ilə
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="flex items-center gap-3">
          {value ? (
            <div className="relative w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0 group">
              <img src={value} alt="Preview" className="w-full h-full object-contain p-1" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Şəkli sil"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
              <ImageIcon className="w-6 h-6 stroke-[1.5]" />
            </div>
          )}

          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleFileChange}
              className="hidden"
              id={`file-upload-${label.replace(/\s+/g, '-')}`}
            />
            <label
              htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`}
              className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                isUploading
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-brand-300 hover:border-brand-500 bg-brand-50/40 hover:bg-brand-50/80 text-brand-800'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                  <span>Yüklənir...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-brand-600" />
                  <span>{value ? 'Şəkli Dəyiş' : 'Cihazdan Şəkil Seç və Yüklə'}</span>
                </>
              )}
            </label>
            <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, WEBP və ya GIF (maks 5MB)</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm"
          />
          {value && (
            <div className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
              <img src={value} alt="Preview" className="w-full h-full object-contain p-1" />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
