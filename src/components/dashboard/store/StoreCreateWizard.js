"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";

/**
 * StoreCreateWizard — 2026-09-10 tələblərinə tam uyğun mağaza yaradma axını:
 *  1) İstifadəçi şərtlərinin məcburi qəbulu
 *  2) Mağaza adının düzgün yazılması (hərf tələbi + canlı yoxlama)
 *  3) Ünvan + xəritədən konum seçimi (Leaflet/OSM, açar tələb etmir)
 *  4) Yaradılandan sonra dərhal dashboard-a yönləndirmə
 */

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
      css.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.body.appendChild(s);
  });
  return leafletPromise;
}

export default function StoreCreateWizard({ user, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    whatsapp: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [pos, setPos] = useState(null); // {lat,lng}
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [nameError, setNameError] = useState("");

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapDivRef = useRef(null);

  // Ad düzgünlüyü: hərf olmalıdır
  useEffect(() => {
    const n = form.name.trim();
    if (!n) { setNameError(""); return; }
    if (n.length < 3) { setNameError("Ad ən azı 3 simvol olmalıdır"); return; }
    if (!/[A-Za-zƏəÖöÜüÇçŞşĞğIı]/.test(n)) { setNameError("Mağaza adı hərflərdən ibarət olmalıdır (yalnız rəqəm/simvol olmaz)"); return; }
    setNameError("");
  }, [form.name]);

  // Xəritəni yüklə və başlat
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapDivRef.current || mapRef.current) return;
      const map = L.map(mapDivRef.current, { attributionControl: true }).setView([40.4093, 49.8671], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      map.on("click", (e) => {
        setPos({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) });
      });
      mapRef.current = map;
      setMapReady(true);
    }).catch(() => setError("Xəritə yüklənə bilmədi — internet bağlantınızı yoxlayın."));
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  }, []);

  // İşarəni (marker) konum dəyişdikcə yerləşdir
  useEffect(() => {
    const L = window.L;
    if (!mapRef.current || !L || !pos) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([pos.lat, pos.lng]);
    } else {
      markerRef.current = L.marker([pos.lat, pos.lng]).addTo(mapRef.current);
    }
    mapRef.current.panTo([pos.lat, pos.lng]);
  }, [pos]);

  function useMyLocation() {
    if (!navigator.geolocation) { setError("Cihazınız konumu dəstəkləmir"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }),
      () => setError("Konum alınmadı — icazə verin və ya xəritəyə klikləyin"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!acceptTerms) { setError("Mağaza açmaq üçün istifadəçi şərtlərini qəbul etməlisiniz."); return; }
    if (nameError) { setError(nameError); return; }
    if (!form.address || form.address.trim().length < 5) { setError("Ünvanı düzgün daxil edin (ən azı 5 simvol)."); return; }
    if (!pos) { setError("Mağaza konumunu xəritədən seçin (xəritəyə klikləyin və ya 'Konumumu istifadə et' düyməsinə basın)."); return; }

    setCreating(true);
    try {
      const res = await apiFetch("/api/stores", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim(),
          lat: pos.lat,
          lng: pos.lng,
          acceptTerms: true,
        }),
      });
      if (onCreated) onCreated(res?.store || res);
    } catch (err) {
      const det = err.details ? " (" + Object.values(err.details).flat().join(", ") + ")" : "";
      setError((err.message || "Mağaza yaradıla bilmədi") + det);
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

      {/* Şərtlər — məcburi */}
      <label className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-amber-600 shrink-0"
          required
        />
        <span className="text-sm text-gray-700">
          <a href="/az/terms" target="_blank" rel="noreferrer" className="font-bold text-brand-700 underline">İstifadəçi şərtlərini</a>{" "}
          oxudum və tam olaraq qəbul edirəm. Şərtlər qəbul olunmadan mağaza açmaq mümkün deyil.
        </span>
      </label>

      {/* Mağaza adı */}
      <div>
        <label className="label-sm">Mağaza adı *</label>
        <input
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          className="input-field"
          placeholder="Fermer Market MMC"
          required
        />
        {nameError ? (
          <p className="text-xs text-red-600 mt-1">{nameError}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Ad düzgün yazılmalıdır — bu ad mağazanızın ünvanında (slug) istifadə olunacaq.</p>
        )}
      </div>

      <div>
        <label className="label-sm">Haqqında</label>
        <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" rows="2" placeholder="Biznesiniz haqqında qısa məlumat..." />
      </div>

      {/* Ünvan */}
      <div>
        <label className="label-sm">Ünvan *</label>
        <input
          value={form.address}
          onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
          className="input-field"
          placeholder="Bakı şəh., Nərimanov r-nu, ..."
          required
        />
      </div>

      {/* Xəritə */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label-sm mb-0">Konum — xəritədən seçin *</label>
          <button type="button" onClick={useMyLocation} className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1">
            <Icon name="mapPin" size={13} /> Konumumu istifadə et
          </button>
        </div>
        <div ref={mapDivRef} className="w-full h-64 rounded-xl border border-gray-200 overflow-hidden z-0" />
        <p className="text-xs text-gray-400 mt-1">
          {!mapReady ? "Xəritə yüklənir..." : pos ? "Seçildi: " + pos.lat + ", " + pos.lng : "Xəritəyə klikləyərək mağazanızın dəqiq yerini işarələyin — bu konum 'Mağazalar' bölməsindəki interaktiv xəritədə görünəcək."}
        </p>
      </div>

      {/* Əlaqə */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label-sm">Telefon</label>
          <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="+994 10 521 09 09" />
        </div>
        <div>
          <label className="label-sm">WhatsApp</label>
          <input value={form.whatsapp} onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))} className="input-field" placeholder="+994 50 123 45 67" />
        </div>
      </div>

      <button type="submit" disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">
        <Icon name="store" size={16} />
        {creating ? "Mağaza yaradılır..." : "Mağazanı Yarat və Elan Verməyə Başla"}
      </button>
    </form>
  );
}
