// Base URL of your Express API. Set NEXT_PUBLIC_API_BASE_URL in .env.local
// e.g. NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    // Required so the httpOnly "token" cookie set by Express is sent/received
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const error = new Error(data?.message || "Request failed");
    error.status = res.status;
    error.code = data?.code; // e.g. "EMAIL_NOT_VERIFIED"
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  register: (payload) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  verifyEmail: (payload) =>
    apiFetch("/api/auth/verify-email", { method: "POST", body: JSON.stringify(payload) }),
  resendVerification: (payload) =>
    apiFetch("/api/auth/resend-verification", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => apiFetch("/api/auth/logout", { method: "POST" }),
  me: () => apiFetch("/api/auth/me", { method: "GET" }),
};