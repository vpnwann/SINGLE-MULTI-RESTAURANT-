"use client";

import { useState } from "react";
import {
  loadRazorpayScript,
  createOrderOnServer,
  verifyPaymentOnServer,
  RAZORPAY_KEY_ID,
} from "@/lib/razorpay";

export interface RazorpaySuccessDetails {
  paymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

interface RazorpayCheckoutProps {
  amount: number; // in rupees
  name: string;
  description: string;
  receipt: string; // unique per checkout attempt, e.g. cart/restaurant id
  prefillName?: string;
  prefillContact?: string;
  onSuccess: (details: RazorpaySuccessDetails) => void;
  onFailure?: (reason: string) => void;
}

export default function RazorpayCheckout({
  amount,
  name,
  description,
  receipt,
  prefillName,
  prefillContact,
  onSuccess,
  onFailure,
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

      // Real order_id from the backend — required by Razorpay Checkout
      // and what makes the payment referenceable/verifiable afterward.
      const order = await createOrderOnServer({ amountInRupees: amount, receipt });

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
        disabled={loading}
        className="w-full bg-orange-600 text-white font-medium py-3 rounded-lg hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? "Processing payment..." : `Pay ₹${amount.toFixed(0)}`}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <p className="text-xs text-gray-400 mt-2 text-center">
        Payments are processed securely by Razorpay.
      </p>
    </div>
  );
}