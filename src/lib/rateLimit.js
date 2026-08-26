/**
 * Simple in-memory rate limiter for Next.js Route Handlers.
 * Resets on each cold-start (Vercel serverless). Good enough for basic
 * brute-force protection on auth endpoints.
 *
 * For production-grade rate limiting, use Upstash Redis + @upstash/ratelimit.
 */

const store = new Map(); // key → [timestamps]

/**
 * @param {Request} request - Next.js Request object
 * @param {object} options
 * @param {number} options.limit   - max requests
 * @param {number} options.windowMs - time window in ms
 * @param {string} [options.keyPrefix] - namespace
 * @returns {Response|null} - Returns a 429 Response if rate-limited, null if OK
 */
export function rateLimit(request, { limit = 10, windowMs = 60_000, keyPrefix = "rl" } = {}) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  const hits = (store.get(key) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  store.set(key, hits);

  // Cleanup old keys every ~1000 requests to prevent unbounded memory growth
  if (Math.random() < 0.001) {
    for (const [k, v] of store.entries()) {
      if (now - Math.max(...v) > windowMs) store.delete(k);
    }
  }

  if (hits.length > limit) {
    const retryAfter = Math.ceil(windowMs / 1000);
    return new Response(
      JSON.stringify({ error: "Çox sayda sorğu. Bir müddət gözləyin." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  return null;
}

/**
 * IP-based rate limiting helper as per Step 4.
 * @param {string} ip - IP address
 * @param {number} windowMs - time window in ms
 * @param {number} maxRequests - max requests allowed in the window
 * @returns {{allowed: boolean, retryAfter: number}}
 */
export function rateLimitCheck(ip, windowMs, maxRequests) {
  const now = Date.now();
  const key = `check:${ip}`;
  const hits = (store.get(key) || []).filter((t) => now - t < windowMs);
  
  if (hits.length >= maxRequests) {
    const oldestHit = hits[0];
    const retryAfter = Math.ceil((oldestHit + windowMs - now) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  hits.push(now);
  store.set(key, hits);
  return { allowed: true, retryAfter: 0 };
}
