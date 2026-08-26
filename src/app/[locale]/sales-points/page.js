"use client";
import Icon from "@/components/ui/Icon";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/home/Footer";
import { apiFetch } from "@/lib/apiClient";
import Script from "next/script";

export default function SalesPointsPage() {
  const [salesPoints, setSalesPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState("");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    apiFetch("/api/sales-points")
      .then((data) => {
        if (data.salesPoints) {
          setSalesPoints(data.salesPoints);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || loading || !window.L || !mapRef.current) return;

    const L = window.L;

    // Default center of Azerbaijan
    const azCenter = [40.4093, 49.8671];

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(azCenter, 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Filtered points
    const filteredPoints = regionFilter
      ? salesPoints.filter(p => p.region.toLowerCase().includes(regionFilter.toLowerCase()))
      : salesPoints;

    // Add markers
    filteredPoints.forEach((sp) => {
      if (sp.lat && sp.lng) {
        // Redefined default marker icon to prevent Leaflet asset resolution errors in Next.js
        const customIcon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        const marker = L.marker([sp.lat, sp.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; padding: 2px;">
              <h5 style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px; color: #16a34a;">${sp.store.name}</h5>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">${sp.address}</p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">${sp.workHours || "Qeyd edilməyib"}</p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">${sp.phone || "Qeyd edilməyib"}</p>
              <a href="/stores/${sp.store.slug}" style="display: inline-block; font-size: 11px; font-weight: bold; color: #16a34a; text-decoration: none; margin-top: 5px;">Mağazaya keçid &rarr;</a>
            </div>
          `);

        markersRef.current.push(marker);
      }
    });

    // Zoom to fit markers if any
    const pointsWithLatLng = filteredPoints.filter(p => p.lat && p.lng);
    if (pointsWithLatLng.length > 0) {
      const bounds = L.latLngBounds(pointsWithLatLng.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [leafletLoaded, salesPoints, regionFilter, loading]);

  const selectSalesPoint = (sp) => {
    if (!window.L || !mapInstanceRef.current || !sp.lat || !sp.lng) return;
    setSelectedPoint(sp);
    mapInstanceRef.current.setView([sp.lat, sp.lng], 14);
    
    // Find matching marker and open popup
    const index = salesPoints.indexOf(sp);
    if (markersRef.current[index]) {
      markersRef.current[index].openPopup();
    }
  };

  const filteredList = regionFilter
    ? salesPoints.filter(p => p.region.toLowerCase().includes(regionFilter.toLowerCase()))
    : salesPoints;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Leaflet CDN CSS injection */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* Leaflet script loader */}
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        onLoad={() => setLeafletLoaded(true)}
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full flex flex-col">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <span className="flex items-center gap-2"><Icon name="map" size={24} className="text-brand-600" /> Satış Nöqtələri Xəritəsi</span>
            </h1>
            <p className="text-gray-500 mt-1">
              FermerMarket mağazalarının sizə ən yaxın satış və təhvil məntəqələrini kəşf edin.
            </p>
          </div>
          <div className="w-full md:w-64">
            <input
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              placeholder="Region/Şəhər axtar (məs: Gəncə)..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-800 text-sm transition-all"
            />
          </div>
        </div>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-sm" style={{ minHeight: "550px" }}>
          {/* Sidebar list */}
          <div className="lg:col-span-1 border-r border-gray-100 flex flex-col max-h-[600px] overflow-y-auto">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100">
              <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">
                Nöqtələr ({filteredList.length})
              </span>
            </div>
            <div className="flex-1 divide-y divide-gray-50">
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm font-medium">Yüklənir...</div>
              ) : filteredList.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Satış nöqtəsi tapılmadı.</div>
              ) : (
                filteredList.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => selectSalesPoint(sp)}
                    className={`w-full p-4 hover:bg-brand-50/50 text-left transition-colors flex flex-col gap-1.5 ${
                      selectedPoint?.id === sp.id ? "bg-brand-50" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{sp.store.name}</h4>
                      <span className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                        {sp.city || sp.region}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 flex items-center gap-1"><Icon name="mapPin" size={12} /> {sp.address}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400 font-semibold w-full">
                      <span className="flex items-center gap-1"><Icon name="clock" size={12} /> {sp.workHours || "Qeyd edilməyib"}</span>
                      {sp.phone && <span className="text-brand-600 flex items-center gap-1"><Icon name="phone" size={12} /> {sp.phone}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Map canvas */}
          <div className="lg:col-span-2 relative h-[400px] lg:h-auto min-h-[450px]">
            {!leafletLoaded && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                <div className="text-center">
                  <svg className="animate-spin h-8 w-8 text-brand-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <p className="text-gray-400 text-xs font-semibold">Xəritə modulu yüklənir...</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }}></div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
