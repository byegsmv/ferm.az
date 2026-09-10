"use client";

import { useEffect, useRef, useState } from "react";

let leafletPromise = null;
function loadLeaflet() {
  if (typeof window === "undefined") return Promise.resolve(window.L);
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const css = document.createElement("link");
      css.id = "leaflet-css";
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.body.appendChild(s);
  });
  return leafletPromise;
}

/**
 * Yenidən istifadə olunan Leaflet konum seçici.
 * props: value = {lat,lng} | null, onChange({lat,lng}), height (px)
 */
export default function LeafletPicker({ value, onChange, height = 240 }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapDivRef.current || mapRef.current) return;
      const map = L.map(mapDivRef.current).setView([40.4093, 49.8671], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      map.on("click", (e) => {
        if (onChange) onChange({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) });
      });
      mapRef.current = map;
      setReady(true);
    }).catch(() => setError("Xəritə yüklənə bilmədi."));
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    if (!mapRef.current || !L || !value) return;
    if (markerRef.current) markerRef.current.setLatLng([value.lat, value.lng]);
    else markerRef.current = L.marker([value.lat, value.lng]).addTo(mapRef.current);
    mapRef.current.panTo([value.lat, value.lng]);
  }, [value]);

  return (
    <div className="relative">
      <div ref={mapDivRef} style={{ height }} className="w-full rounded-xl border border-gray-200 overflow-hidden z-0" />
      {!ready && !error && <div className="absolute inset-0 bg-gray-50 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-xs">Xəritə yüklənir...</div>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-xs text-gray-400 mt-1">
        {value ? `Konum: ${value.lat}, ${value.lng}` : "Xəritəyə klikləyərək konumu seçin — mağazanız 'Mağazalar' bölməsindəki xəritədə görünəcək."}
      </p>
    </div>
  );
}
