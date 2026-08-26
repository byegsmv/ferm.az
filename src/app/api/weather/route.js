// GET /api/weather?city=Şamaxı — free, keyless weather lookup for farmers
// planning sowing/harvest work. Uses wttr.in's JSON endpoint (no API key,
// no signup, generous free usage) instead of a paid provider — matches the
// project's minimum-budget requirement. If wttr.in is ever unreliable at
// scale, swap for OpenWeatherMap's free tier (requires OPENWEATHER_API_KEY).
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min in-memory cache per city — cheap and plenty fresh for farming decisions
const cache = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  if (!city) return Response.json({ error: "city tələb olunur" }, { status: 422 });

  const cacheKey = city.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Response.json(cached.data);
  }

  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      headers: { "User-Agent": "curl" }, // wttr.in requires a non-browser-looking UA for the JSON endpoint
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`wttr.in ${res.status}`);
    const raw = await res.json();

    const current = raw.current_condition?.[0];
    const today = raw.weather?.[0];
    const data = {
      city,
      tempC: current ? Number(current.temp_C) : null,
      feelsLikeC: current ? Number(current.FeelsLikeC) : null,
      humidity: current ? Number(current.humidity) : null,
      precipMm: current ? Number(current.precipMM) : null,
      windKmph: current ? Number(current.windspeedKmph) : null,
      description: current?.lang_az?.[0]?.value || current?.weatherDesc?.[0]?.value || null,
      forecast: (raw.weather || []).slice(0, 3).map((d) => ({
        date: d.date,
        maxTempC: Number(d.maxtempC),
        minTempC: Number(d.mintempC),
        chanceOfRain: Math.max(...(d.hourly || []).map((h) => Number(h.chanceofrain) || 0)),
      })),
    };

    cache.set(cacheKey, { at: Date.now(), data });
    return Response.json(data);
  } catch (err) {
    // FIXED: Hide error details from client, log internally only
    console.error("[weather]", err.message);
    return Response.json({ error: "Hava məlumatı alına bilmədi" }, { status: 502 });
  }
}
