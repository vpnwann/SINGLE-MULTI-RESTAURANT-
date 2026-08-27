/**
 * Razorpay integration helpers.
 *
 * This is a FRONTEND-ONLY demo. There is no backend in this project, so we
 * never create a real Razorpay order (that requires the secret key on a
 * server) and we never reference RAZORPAY_KEY_SECRET anywhere in this code.
 *
 * Structure notes for a future Express.js backend:
 *  - POST /api/razorpay/create-order
 *      body: { amount: number, currency: "INR", receipt: string }
 *      -> creates a real order using `razorpay` npm package + KEY_SECRET
 *      -> returns { orderId, amount, currency }
 *  - POST /api/razorpay/verify-payment
 *      body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *      -> verifies the signature using KEY_SECRET (HMAC SHA256)
 *      -> returns { verified: boolean }
 *
 * `createOrderOnServer` and `verifyPaymentOnServer` below are stubbed to show
 * exactly where those calls would go once a backend exists.
 */

export const RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key";

export const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface CreateOrderParams {
  amountInRupees: number;
  receipt: string;
}

/**
 * Loads the Razorpay checkout script exactly once.
 * Resolves `false` if the script fails to load (e.g. no network access),
 * so callers can fall back to the mock payment flow.
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
 * STUB: would call POST /api/razorpay/create-order on a real backend.
 * Since there is no backend here, this always throws so callers know to
 * fall back to the mock/demo payment flow.
 */
export async function createOrderOnServer(
  params: CreateOrderParams
): Promise<never> {
  void params;
  throw new Error(
    "No backend available to create a real Razorpay order. Use the mock payment flow."
  );
}

/**
 * STUB: would call POST /api/razorpay/verify-payment on a real backend.
 */
export async function verifyPaymentOnServer(
  response: RazorpaySuccessResponse
): Promise<boolean> {
  void response;
  throw new Error("No backend available to verify Razorpay payment signature.");
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
