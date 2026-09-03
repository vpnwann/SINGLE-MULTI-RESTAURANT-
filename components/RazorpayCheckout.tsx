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
   * Native Expo -> Next.js result listener.
   *
   * Expo opens native Razorpay and sends the result back into
   * this WebView using webViewRef.current.postMessage(...).
   */
  useEffect(() => {
    const handleNativeMessage = async (event: MessageEvent) => {
      try {
        const raw = event.data;

        if (typeof raw !== "string") {
          return;
        }

        const data = JSON.parse(raw);

        if (data?.type === "RAZORPAY_SUCCESS") {
          setLoading(true);
          setError(null);

          const verified = await verifyPaymentOnServer({
            razorpay_payment_id: data.paymentId,
            razorpay_order_id: data.razorpayOrderId,
            razorpay_signature: data.razorpaySignature,
          });

          setLoading(false);

          if (!verified) {
            setError(
              "Payment verification failed. Please contact support before retrying."
            );
            onFailure?.("verification_failed");
            return;
          }

          onSuccess({
            paymentId: data.paymentId,
            razorpayOrderId: data.razorpayOrderId,
            razorpaySignature: data.razorpaySignature,
          });

          return;
        }

        if (data?.type === "RAZORPAY_FAILURE") {
          setLoading(false);

          const message =
            typeof data.message === "string"
              ? data.message
              : "Payment failed. Please try again.";

          setError(message);
          onFailure?.("payment_failed");
        }
      } catch (err) {
        console.error("Native Razorpay message error:", err);
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
       * The Next.js page still creates the Razorpay order through
       * your existing Express API. This is important because it
       * preserves your existing authentication/server-side pricing.
       *
       * Expo then opens the NATIVE Razorpay SDK using this order.
       */
      if (window.ReactNativeWebView) {
        const order = await createOrderOnServer({
          restaurantId,
          items,
          couponCode,
          address,
        });

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
         * Do not set loading=false here.
         * Expo will send either RAZORPAY_SUCCESS or
         * RAZORPAY_FAILURE back to this WebView.
         */
        return;
      }

      /*
       * ============================================================
       * NORMAL WEBSITE / BROWSER
       * ============================================================
       */
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Could not load the payment provider. Check your connection and try again."
        );
      }

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

        handler: async (response: unknown) => {
          try {
            const r = response as {
              razorpay_payment_id: string;
              razorpay_order_id: string;
              razorpay_signature: string;
            };

            const verified = await verifyPaymentOnServer(r);

            setLoading(false);

            if (!verified) {
              setError(
                "Payment verification failed. Please contact support before retrying."
              );
              onFailure?.("verification_failed");
              return;
            }

            onSuccess({
              paymentId: r.razorpay_payment_id,
              razorpayOrderId: r.razorpay_order_id,
              razorpaySignature: r.razorpay_signature,
            });
          } catch (err) {
            console.error("Razorpay verification error:", err);

            setLoading(false);
            setError("Payment verification failed. Please contact support.");
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

      razorpay.on("payment.failed", (...args: unknown[]) => {
        console.error("RAZORPAY PAYMENT FAILED:", args);

        setLoading(false);
        setError(
          "Payment failed. Please try another payment method."
        );
        onFailure?.("payment_failed");
      });

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
        {loading ? "Processing payment..." : "Pay online"}
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

