"use client";
import { Link } from "@/i18n/routing";

export default function TermsCheckbox({ checked, onChange, error }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-green-600 shrink-0"
          required
        />
        <span className="text-sm text-gray-700">
          <Link
            href="/terms"
            target="_blank"
            className="text-green-600 font-bold hover:underline"
          >
            İstifadə Şərtləri və Qaydaları
          </Link>{" "}
          oxudum və tam olaraq qəbul edirəm{" "}
          <span className="text-red-500 font-bold">*</span>
        </span>
      </label>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>
      )}
    </div>
  );
}
