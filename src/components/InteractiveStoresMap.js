"use client";
import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import Script from "next/script";

export default function InteractiveStoresMap({ stores = [], salesPoints = [] }) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [regionFilter, setRegionFilter] = useState("");
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Load Leaflet CSS
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzVCf9xK4Qpf0U0rOTfnGNu4T4=";
    link.crossOrigin = "";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Initialize map when Leaflet is ready
  useEffect(() => {
    if (!leafletLoaded || !window.L || !mapRef.current) return;

    const L = window.L;
    const azCenter = [40.4093, 49.8671];

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, { scrollWheelZoom: false }).setView(azCenter, 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Add sales point markers
    const allPoints = [...salesPoints, ...stores.map(s => ({
      id: `store-${s.id}`,
      name: s.name,
      address: s.address,
      phone: s.phone,
      type: "store",
      lat: s.lat,
      lng: s.lng,
      region: s.region || ""
    }))].filter(p => p.lat && p.lng);

    const filtered = regionFilter
      ? allPoints.filter(p => (p.region || "").toLowerCase().includes(regionFilter.toLowerCase()))
      : allPoints;

    filtered.forEach(point => {
      const isStore = point.type === "store" || String(point.id).startsWith("store-");
      const icon = L.divIcon({
        html: `<div style="background: ${isStore ? "#16a34a" : "#2563eb"}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <span style="transform: rotate(45deg); color: white; font-size: 14px;">${isStore ? "🏪" : "📍"}</span>
        </div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker([parseFloat(point.lat), parseFloat(point.lng)], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 180px;">
            <strong style="font-size: 14px; color: #111827;">${point.name}</strong><br/>
            ${point.address ? `<span style="font-size: 12px; color: #6b7280;">📍 ${point.address}</span><br/>` : ""}
            ${point.phone ? `<span style="font-size: 12px; color: #6b7280;">📞 ${point.phone}</span><br/>` : ""}
            <span style="font-size: 11px; color: ${isStore ? "#16a34a" : "#2563eb"}; font-weight: 600;">${isStore ? "Mağaza" : "Satış Nöqtəsi"}</span>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (filtered.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    setTimeout(() => map.invalidateSize(), 200);
  }, [leafletLoaded, stores, salesPoints, regionFilter]);

  return (
    <div>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nVDchvRj7x4F7P5K6m4qfUqSG5lS8f5x5f2Q6e6e6="
        crossOrigin=""
        onLoad={() => setLeafletLoaded(true)}
      />
      
      {/* Region Filter */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon name="filter" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Region üzrə filtrlə..."
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-brand-600 inline-block"></span> Mağaza
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> Satış Nöqtəsi
          </span>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-[450px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
        style={{ zIndex: 1 }}
      />

      {/* Info text */}
      {salesPoints.length === 0 && stores.every(s => !s.lat) && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-xl p-3">
          <Icon name="info" size={16} className="text-amber-500 shrink-0" />
          <span>Mağaza və satış nöqtələrinə koordinat (lat/lng) əlavə edildikdə xəritədə görsənəcəklər.</span>
        </div>
      )}
    </div>
  );
}
