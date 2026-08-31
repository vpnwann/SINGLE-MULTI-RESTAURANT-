const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
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
    apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyEmail: (payload) =>
    apiFetch("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resendVerification: (payload) =>
    apiFetch("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiFetch("/api/auth/logout", {
      method: "POST",
    }),

  me: () =>
    apiFetch("/api/auth/me", {
      method: "GET",
    }),
};

// `items` is a jsonb column — most pg setups auto-parse it to an array,
// but some configs (or a plain `json` column type, or a driver without
// automatic jsonb parsing) hand it back as a raw string instead.
// Normalize here the same way the order-tracking page already does for
// `address`, so `order.items.map(...)` never breaks or silently no-ops.
function parseItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapOrder(row) {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    items: parseItems(row.items),
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
  list: async () => {
    const res = await apiFetch("/api/orders", {
      method: "GET",
    });

    return {
      ...res,
      data: res.data.map(mapOrder),
    };
  },

  get: async (orderId) => {
    const res = await apiFetch(`/api/orders/${orderId}`, {
      method: "GET",
    });

    return {
      ...res,
      data: mapOrder(res.data),
    };
  },

  create: async (payload) => {
    const res = await apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      ...res,
      data: mapOrder(res.data),
    };
  },

  // ADD THIS
  verifyPayment: async (payload) => {
    return apiFetch("/api/razorpay/verify-payment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};