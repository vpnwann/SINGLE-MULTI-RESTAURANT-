"use client";

import { useState } from "react";
import { loadRazorpayScript, RAZORPAY_KEY_ID } from "@/lib/razorpay";

interface RazorpayCheckoutProps {
  amount: number; // in rupees
  name: string;
  description: string;
  onSuccess: (paymentId: string) => void;
  onFailure?: (reason: string) => void;
}

export default function RazorpayCheckout({
  amount,
  name,
  description,
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

      // There is no backend in this project to create a real Razorpay
      // order (that requires RAZORPAY_KEY_SECRET on a server), so if the
      // checkout script isn't available we fall back to a mock payment
      // that still completes the demo order flow end-to-end.
      if (!scriptLoaded || !window.Razorpay) {
        runMockPayment();
        return;
      }

      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: Math.round(amount * 100), // paise
        currency: "INR",
        name,
        description,
        // In a real integration this order_id would come from
        // POST /api/razorpay/create-order on an Express backend.
        prefill: {
          name: "Namit",
          contact: "9999999999",
        },
        theme: { color: "#ea580c" },
        handler: (response: unknown) => {
          const paymentId =
            (response as { razorpay_payment_id?: string })
              ?.razorpay_payment_id ?? `pay_demo_${Date.now()}`;
          setLoading(false);
          onSuccess(paymentId);
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
    } catch {
      runMockPayment();
    }
  };

  const runMockPayment = () => {
    // Simulates a successful test payment so the demo flow always works,
    // even without network access to Razorpay's checkout script.
    setTimeout(() => {
      setLoading(false);
      onSuccess(`pay_mock_${Date.now()}`);
    }, 900);
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
        Test mode — no real payment will be charged.
      </p>
    </div>
  );
}
