"use client";

import { useEffect, useState } from "react";
import {
  loadRazorpayScript,
  createOrderOnServer,
  verifyPaymentOnServer,
  RAZORPAY_KEY_ID,
  type CreateOrderItem,
  type OrderAddress,
} from "../lib/razorpay";

export interface RazorpaySuccessDetails {
  paymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

interface RazorpayProps {
  restaurantId: number;
  items: CreateOrderItem[];
  couponCode?: string;
  address: OrderAddress;
  name: string;
  description: string;
  prefillName?: string;
  prefillContact?: string;
  onSuccess: (details: RazorpaySuccessDetails) => void;
  onFailure?: (reason: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (
        event: string,
        handler: (...args: unknown[]) => void
      ) => void;
    };

    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export default function RazorpayCheckout({
  restaurantId,
  items,
  couponCode,
  address,
  name,
  description,
  prefillName,
  prefillContact,
  onSuccess,
  onFailure,
  disabled,
}: RazorpayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * ============================================================
   * NATIVE EXPO -> NEXT.JS
   * ============================================================
   *
   * Native Razorpay has already completed the payment.
   *
   * IMPORTANT:
   * We DO NOT verify the payment here.
   *
   * The parent checkout component's onSuccess() handles the
   * existing verification + order confirmation flow.
   */
  useEffect(() => {
    const handleNativeMessage = (event: MessageEvent) => {
      try {
        const raw = event.data;

        if (typeof raw !== "string") {
          return;
        }

        const data = JSON.parse(raw);

        /*
         * Native Razorpay SUCCESS
         */
    if (data?.type === "RAZORPAY_SUCCESS") {
  console.log(
    "========== RAZORPAY NATIVE SUCCESS RECEIVED =========="
  );

  console.log(
    "Payment ID:",
    data.paymentId
  );

  console.log(
    "Order ID:",
    data.razorpayOrderId
  );

  console.log(
    "Signature:",
    data.razorpaySignature
  );

  setLoading(false);
  setError(null);

  if (
    !data.paymentId ||
    !data.razorpayOrderId ||
    !data.razorpaySignature
  ) {
    setError(
      "Razorpay returned an incomplete payment response."
    );

    onFailure?.(
      "invalid_payment_response"
    );

    return;
  }

  onSuccess({
    paymentId: data.paymentId,

    razorpayOrderId:
      data.razorpayOrderId,

    razorpaySignature:
      data.razorpaySignature,
  });

  return;
}

        /*
         * Native Razorpay FAILURE
         */
        if (data?.type === "RAZORPAY_FAILURE") {
          console.error("Native Razorpay failure:", data);

          setLoading(false);

          const message =
            typeof data.message === "string"
              ? data.message
              : "Payment failed. Please try again.";

          setError(message);
          onFailure?.("payment_failed");

          return;
        }
      } catch (err) {
        console.error("Native Razorpay message error:", err);

        setLoading(false);
        setError("Could not process the payment response.");
        onFailure?.("payment_response_error");
      }
    };

    window.addEventListener("message", handleNativeMessage);

    return () => {
      window.removeEventListener("message", handleNativeMessage);
    };
  }, [onFailure, onSuccess]);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      /*
       * ============================================================
       * EXPO / REACT NATIVE WEBVIEW
       * ============================================================
       *
       * Create the order using your existing Express API.
       *
       * Express creates:
       *
       * Razorpay order
       * +
       * your internal pending DB order
       *
       * Then Expo opens native Razorpay.
       */
      if (window.ReactNativeWebView) {
        console.log("Running native Razorpay flow");

        const order = await createOrderOnServer({
          restaurantId,
          items,
          couponCode,
          address,
        });

        console.log("Razorpay order created:", order.orderId);

        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "START_RAZORPAY",

            orderId: order.orderId,
            amount: order.amount,
            currency: order.currency,

            key: RAZORPAY_KEY_ID,

            name,
            description,

            prefillName,
            prefillContact,
          })
        );

        /*
         * Keep loading=true.
         *
         * Expo will send either:
         *
         * RAZORPAY_SUCCESS
         *
         * or
         *
         * RAZORPAY_FAILURE
         *
         * back to this WebView.
         */

        return;
      }

      /*
       * ============================================================
       * NORMAL WEBSITE / BROWSER RAZORPAY
       * ============================================================
       */

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Could not load the payment provider. Check your connection and try again."
        );
      }

      /*
       * Create the same server-side order used by native.
       */
      const order = await createOrderOnServer({
        restaurantId,
        items,
        couponCode,
        address,
      });

      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY_ID,

        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,

        name,
        description,

        prefill: {
          name: prefillName,
          contact: prefillContact,
        },

        theme: {
          color: "#ea580c",
        },

        /*
         * Browser Razorpay success.
         *
         * This continues to use your existing verification flow.
         */
        handler: async (response: unknown) => {
          try {
            const r = response as {
              razorpay_payment_id: string;
              razorpay_order_id: string;
              razorpay_signature: string;
            };

            console.log("Browser Razorpay success:", r);

            const verified = await verifyPaymentOnServer(r);

            if (!verified) {
              setLoading(false);

              setError(
                "Payment verification failed. Please contact support before retrying."
              );

              onFailure?.("verification_failed");
              return;
            }

            setLoading(false);

            /*
             * Same success callback used by the parent checkout.
             */
            onSuccess({
              paymentId: r.razorpay_payment_id,
              razorpayOrderId: r.razorpay_order_id,
              razorpaySignature: r.razorpay_signature,
            });
          } catch (err) {
            console.error("Razorpay verification error:", err);

            setLoading(false);

            setError(
              "Payment verification failed. Please contact support."
            );

            onFailure?.("verification_failed");
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled.");
          },
        },
      });

      razorpay.on(
        "payment.failed",
        (...args: unknown[]) => {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            args
          );

          setLoading(false);

          setError(
            "Payment failed. Please try another payment method."
          );

          onFailure?.("payment_failed");
        }
      );

      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);

      setLoading(false);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );

      onFailure?.("payment_error");
    }
  };

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading || disabled}
        className="w-full bg-orange-600 text-white font-medium py-3 rounded-lg hover:bg-orange-700 disabled:opacity-60"
      >
        {loading
          ? "Processing payment..."
          : "Pay online"}
      </button>

      {error && (
        <p className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-400 mt-2 text-center">
        Payments are processed securely by Razorpay.
      </p>
    </div>
  );
}