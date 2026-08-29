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
    error.code = data?.code;
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

// The Express /api/orders routes return raw DB rows (snake_case: restaurant_name,
// order_status, created_at, etc). This adapts each row to the camelCase Order
// shape the frontend components expect.
function mapOrder(row) {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    items: row.items, // jsonb array of { foodId, name, price, quantity }
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    platformFee: Number(row.platform_fee),
    discount: Number(row.discount),
    gst: Number(row.gst),
    total: Number(row.total),
    couponCode: row.coupon_code,
    address: row.address,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    createdAt: row.created_at,
  };
}

export const ordersApi = {
  // Backend scopes this to req.user.id via the auth cookie — no userId param needed.
  list: async () => {
    const res = await apiFetch("/api/orders", { method: "GET" });
    return { ...res, data: res.data.map(mapOrder) };
  },
  get: async (orderId) => {
    const res = await apiFetch(`/api/orders/${orderId}`, { method: "GET" });
    return { ...res, data: mapOrder(res.data) };
  },
  create: async (payload) => {
    const res = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
    return { ...res, data: mapOrder(res.data) };
  },
};