"use client";
import Icon from "@/components/ui/Icon";
import { useRef, useState, useCallback } from "react";
import { getToken } from "@/lib/apiClient";

// Reusable multi-image uploader with previews, drag-to-reorder, and cover selection.
// value: array of { url } — controlled from parent form state.
// onChange(newArray)
export default function ImageUploader({ value = [], onChange, max = 8 }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (value.length + files.length > max) {
      setError(`Ən çoxu ${max} şəkil əlavə edə bilərsiniz`);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const token = getToken();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yükləmə xətası");
      onChange([...value, ...data.images]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(idx) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function makeCover(idx) {
    if (idx === 0) return;
    const next = [...value];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  }

  // Native HTML5 drag-and-drop for reordering
  function onDragStart(e, idx) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  }
  function onDrop(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { reset(); return; }
    const next = [...value];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    reset();
  }
  function reset() { setDragIdx(null); setOverIdx(null); }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((img, idx) => (
          <div
            key={img.url + idx}
            draggable
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDrop={(e) => onDrop(e, idx)}
            onDragEnd={reset}
            className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 group cursor-grab active:cursor-grabbing transition-all duration-150 ${
              overIdx === idx && dragIdx !== idx
                ? "border-brand-400 scale-105 shadow-lg"
                : idx === 0
                ? "border-brand-400"
                : "border-gray-200"
            } ${dragIdx === idx ? "opacity-40" : ""}`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover pointer-events-none" />
            {idx === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-brand-600 text-white text-[9px] text-center py-0.5 font-semibold">
                Əsas
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none hover:bg-red-600 transition-colors"
              aria-label="Şəkli sil"
            >
              <Icon name="close" size={14} />
            </button>
            {idx !== 0 && (
              <button
                type="button"
                onClick={() => makeCover(idx)}
                className="absolute top-0.5 left-0.5 bg-black/60 text-white rounded px-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-600"
                title="Əsas şəkil et"
              >
                <Icon name="star" size={12} className="text-amber-400 fill-amber-400" />
              </button>
            )}
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-brand-600 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] font-medium">Şəkil əlavə et</span>
              </>
            )}
          </button>
        )}
      </div>

      {value.length > 1 && (
        <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1.5"><Icon name="lightbulb" size={14} className="text-amber-500 shrink-0" /> Şəkilləri sürükləyərək sırasını dəyişə bilərsiniz. Birinci şəkil əsas şəkil olur.</p>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}
