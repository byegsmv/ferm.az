"use client";

const TOKEN_KEY = "fmk_access_token";
const REFRESH_KEY = "fmk_refresh_token";
const USER_KEY = "fmk_user";

export function saveSession({ accessToken, refreshToken, user }) {
  if (typeof window === "undefined") return;
  // Token is saved to localStorage for client-side API calls
  // Cookie is set by the server (HttpOnly) for middleware auth checks
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("fmk-auth-changed"));
}

export async function clearSession() {
  if (typeof window === "undefined") return;
  // Clear localStorage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  // Clear HttpOnly cookie via logout API
  try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
  window.dispatchEvent(new Event("fmk-auth-changed"));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Exchanges the stored refresh token for a new access token. Returns the new
// access token on success, or null if the refresh token is missing/expired/invalid
// (in which case the stale session is cleared so the UI stops pretending the
// user is still logged in).
let refreshInFlight = null;
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  const data = await refreshInFlight;
  if (!data?.accessToken) {
    clearSession();
    return null;
  }

  localStorage.setItem(TOKEN_KEY, data.accessToken);
  // Cookie is updated by the refresh API's Set-Cookie header
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.accessToken;
}

async function doFetch(path, options, token) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(path, {
    ...options,
    headers,
    credentials: "include", // Send cookies (HttpOnly auth cookie) with every request
  });
}

export async function apiFetch(path, options = {}) {
  let token = getToken();
  let res = await doFetch(path, options, token);

  // Access tokens live only 15 minutes. If one just expired, transparently
  // refresh it and retry once instead of failing the request/misreporting
  // the user as logged out or as a guest.
  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(path, options, newToken);
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const error = new Error(data?.error || "Xəta baş verdi");
    error.status = res.status;
    error.details = data?.details;
    throw error;
  }
  return data;
}
