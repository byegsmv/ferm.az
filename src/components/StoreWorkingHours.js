"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

const DAYS_LIST = [
  { key: "mon", label: "B.e" },
  { key: "tue", label: "Ç.a" },
  { key: "wed", label: "Çər" },
  { key: "thu", label: "C.a" },
  { key: "fri", label: "Cümə" },
  { key: "sat", label: "Şən" },
  { key: "sun", label: "Baz" },
];

const JS_DAY_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function StoreWorkingHours({ workingHours }) {
  const [expanded, setExpanded] = useState(false);

  let hours = {};
  if (typeof workingHours === "object" && workingHours !== null) hours = workingHours;
  else if (typeof workingHours === "string") {
    try { hours = JSON.parse(workingHours); } catch { hours = {}; }
  }

  const hasAnyHours = DAYS_LIST.some((d) => hours[d.key]);
  if (!hasAnyHours) return null;

  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];
  const today = hours[todayKey];
  const isOpenNow = (() => {
    if (!today || today.isClosed) return false;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = (today.open || "00:00").split(":").map(Number);
    const [closeH, closeM] = (today.close || "23:59").split(":").map(Number);
    return nowMinutes >= openH * 60 + openM && nowMinutes <= closeH * 60 + closeM;
  })();

  return (
    <div className="border border-gray-100 rounded-xl bg-gray-50">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm"
      >
        <span className="flex items-center gap-2 font-medium text-gray-700">
          <Icon name="clock" size={15} className="text-gray-400" />
          İş saatları
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOpenNow ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"}`}>
            {isOpenNow ? "Açıqdır" : "Bağlıdır"}
          </span>
          {today && !today.isClosed && (
            <span className="text-xs text-gray-400">{today.open}–{today.close}</span>
          )}
        </span>
        <Icon name="chevronDown" size={16} className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-3.5 pb-3 grid grid-cols-1 gap-1">
          {DAYS_LIST.map((d) => {
            const dayInfo = hours[d.key];
            const isToday = d.key === todayKey;
            return (
              <div key={d.key} className={`flex items-center justify-between text-xs py-1 ${isToday ? "font-bold text-brand-700" : "text-gray-500"}`}>
                <span>{d.label}</span>
                <span>{dayInfo?.isClosed || !dayInfo ? "Bağlı" : `${dayInfo.open} – ${dayInfo.close}`}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
