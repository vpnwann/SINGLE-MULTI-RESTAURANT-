/**
 * Razorpay integration helpers, backed by a real Express server.
 *
 *  - POST /api/razorpay/create-order  -> creates a real Razorpay order,
 *    returns { orderId, amount, currency }
 *  - POST /api/razorpay/verify-payment -> verifies the HMAC SHA256
 *    signature server-side, returns { verified: boolean }
 *
 * The actual security boundary is POST /api/orders, which independently
 * re-verifies the signature before persisting paymentStatus: "Paid" — so
 * verifyPaymentOnServer here is for fast UI feedback, not the source of
 * truth.
 */

import { apiFetch } from "./razorapi";

export const RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key";

export const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateOrderParams {
  amountInRupees: number;
  receipt: string;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
}

/**
 * Loads the Razorpay checkout script exactly once.
 * Resolves `false` if the script fails to load (e.g. no network access).
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.getElementById("razorpay-checkout-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Calls POST /api/razorpay/create-order to get a real Razorpay order_id. */
export async function createOrderOnServer(
  params: CreateOrderParams
): Promise<CreateOrderResult> {
  const res = await apiFetch("/api/razorpay/create-order", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return res.data;
}

/** Calls POST /api/razorpay/verify-payment to check the HMAC signature. */
export async function verifyPaymentOnServer(
  response: RazorpaySuccessResponse
): Promise<boolean> {
  const res = await apiFetch("/api/razorpay/verify-payment", {
    method: "POST",
    body: JSON.stringify(response),
  });
  return Boolean(res.data?.verified);
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}