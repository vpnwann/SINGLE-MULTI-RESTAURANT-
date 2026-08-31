"use client";

import { useState } from "react";
import {
  loadRazorpayScript,
  createOrderOnServer,
  verifyPaymentOnServer,
  RAZORPAY_KEY_ID,
  type CreateOrderItem,
  type OrderAddress,
} from "@/lib/razorpay";

export interface RazorpaySuccessDetails {
  paymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

interface RazorpayCheckoutProps {
  // NOTE: no `amount` prop — the server recomputes the total from
  // restaurantId + items and that's what actually gets charged. Passing
  // an amount in from here would just be a display number with no
  // enforcement, and it's one less thing that can drift out of sync with
  // what the backend actually charges.
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
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Could not load the payment provider. Check your connection and try again.");
      }

      // Real order_id from the backend, created against a server-computed
      // total — required by Razorpay Checkout and what makes the payment
      // referenceable/verifiable afterward.
      const order = await createOrderOnServer({ restaurantId, items, couponCode, address });

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
        theme: { color: "#ea580c" },
        handler: async (response: unknown) => {
          const r = response as {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          };

          const verified = await verifyPaymentOnServer(r);
          setLoading(false);

          if (!verified) {
            setError("Payment verification failed. Please contact support before retrying.");
            onFailure?.("verification_failed");
            return;
          }

          onSuccess({
            paymentId: r.razorpay_payment_id,
            razorpayOrderId: r.razorpay_order_id,
            razorpaySignature: r.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled.");
          },
        },
      });

      razorpay.on("payment.failed", () => {
        setLoading(false);
        setError("Payment failed. Please try again.");
        onFailure?.("payment_failed");
      });

      razorpay.open();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <p className="text-xs text-gray-400 mt-2 text-center">
        Payments are processed securely by Razorpay.
      </p>
    </div>
  );
}