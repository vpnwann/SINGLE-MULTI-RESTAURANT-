/**
 * Razorpay integration helpers, backed by a real Express server.
 *
 *  - POST /api/razorpay/create-order   -> takes { restaurantId, items, couponCode? },
 *    recomputes the total server-side (never trusts a client-supplied amount),
 *    creates a real Razorpay order, returns { orderId, amount, currency }.
 *  - POST /api/razorpay/verify-payment -> verifies the HMAC SHA256 signature,
 *    then independently confirms the payment with Razorpay's API and checks
 *    it against the order this user created, returns { verified: boolean }.
 *
 * There is no webhook in this setup, so verify-payment IS the security
 * boundary here — it re-fetches the payment from Razorpay server-side rather
 * than trusting the client's claim that payment succeeded.
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

export interface CreateOrderItem {
  foodId: number;
  quantity: number;
}

export interface OrderAddress {
  name: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
}

export interface CreateOrderParams {
  restaurantId: number;
  items: CreateOrderItem[];
  couponCode?: string;
  address: OrderAddress;
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

/**
 * Calls POST /api/razorpay/create-order with the cart contents (not an
 * amount) — the server looks up prices itself and computes the real total,
 * so there's nothing here for a client to tamper with.
 */
export async function createOrderOnServer(
  params: CreateOrderParams
): Promise<CreateOrderResult> {
  const res = await apiFetch("/api/razorpay/create-order", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return res.data;
}

/**
 * Calls POST /api/razorpay/verify-payment. The server checks the signature,
 * then independently confirms with Razorpay that the payment captured for
 * the expected amount before reporting `verified: true`.
 */
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