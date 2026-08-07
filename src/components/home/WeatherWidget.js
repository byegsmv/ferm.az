"use client";
import { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { useSiteTexts } from "@/lib/siteTexts";

export default function WeatherWidget() {
  const { t } = useSiteTexts();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to get user's location, fallback to Baku (40.4093, 49.8671)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(40.4093, 49.8671) // Fallback to Baku
      );
    } else {
      fetchWeather(40.4093, 49.8671);
    }
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      // Free open-meteo API
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await res.json();
      setWeather(data.current_weather);
    } catch (err) {
      console.error("Failed to fetch weather", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !weather) return null;

  return (
    <div className="flex items-center gap-2 bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors cursor-default">
      <Icon name="sun" size={20} className="text-amber-500" />
      <div className="flex flex-col">
        <span className="text-xs font-bold text-blue-900 leading-tight">{weather.temperature}°C</span>
        <span className="text-[10px] text-blue-600 font-medium leading-tight">{t('homepage.weatherWind', 'külək')}: {weather.windspeed} km/s</span>
      </div>
    </div>
  );
}
