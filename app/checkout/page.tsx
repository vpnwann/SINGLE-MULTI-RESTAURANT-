"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import CartSummary from "@/components/CartSummary";
import RazorpayCheckout, { RazorpaySuccessDetails } from "@/components/RazorpayCheckout";
import { ordersApi } from "../orders/orderapi";

// NOTE: this component assumes each cart item's `id` is the food item's
// database id (foodId) — the backend's POST /api/orders expects
// { foodId, quantity } per item and re-derives prices itself. If your
// CartContext uses a different key for the food id, update the mapping
// in buildOrderPayload below.

type AddressForm = {
  name: string;
  line: string;
  city: string;
  pincode: string;
};

const DEFAULT_ADDRESS: AddressForm = {
  name: "Namit",
  line: "MI Road",
  city: "Jaipur",
  pincode: "302001",
};

// Delivery address persistence — saved to the browser's localStorage so
// it survives refreshes and future visits. Falls back to DEFAULT_ADDRESS
// the first time, or if storage is unavailable/corrupted.
const ADDRESS_STORAGE_KEY = "savourHighStreet:deliveryAddress";

function loadStoredAddress(): AddressForm {
  if (typeof window === "undefined") {
    return DEFAULT_ADDRESS;
  }

  try {
    const raw = window.localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADDRESS;

    const parsed = JSON.parse(raw);

    const isValid =
      parsed &&
      typeof parsed.name === "string" &&
      typeof parsed.line === "string" &&
      typeof parsed.city === "string" &&
      typeof parsed.pincode === "string";

    return isValid ? parsed : DEFAULT_ADDRESS;
  } catch (err) {
    console.error("Could not read saved address:", err);
    return DEFAULT_ADDRESS;
  }
}

function saveStoredAddress(address: AddressForm) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      ADDRESS_STORAGE_KEY,
      JSON.stringify(address)
    );
  } catch (err) {
    // Storage can fail in private browsing / when full — non-fatal,
    // checkout still works, the address just won't persist this time.
    console.error("Could not save address:", err);
  }
}

type PaymentMethod = "razorpay" | "cod";

const fontStyles = (
  <style jsx global>{`
    @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap");
    .font-display {
      font-family: "Fraunces", serif;
      font-optical-sizing: auto;
    }
    .font-body {
      font-family: "Work Sans", sans-serif;
    }
    .font-data {
      font-family: "IBM Plex Mono", monospace;
    }
  `}</style>
);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, restaurantId, restaurantName, coupon, totals, clearCart } = useCart();

  // Lazy initializer so the very first render already has the saved
  // address (avoids a flash of the default before useEffect runs).
  const [address, setAddress] = useState<AddressForm>(loadStoredAddress);
  const [editingAddress, setEditingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist on every change, so partial edits aren't lost even if the
  // user navigates away without hitting "Done".
  useEffect(() => {
    saveStoredAddress(address);
  }, [address]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] font-body">
        {fontStyles}
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold text-[#1C1B1A] mb-2">
            Your cart is empty
          </h1>
          <p className="text-[#8A8578] text-sm mb-5">
            Add some items to your cart before checking out.
          </p>
          <Link
            href="/restaurants"
            className="inline-block bg-[#B8481E] text-white font-medium px-5 py-2.5 rounded-md hover:bg-[#8f3717] transition-colors"
          >
            Browse restaurants
          </Link>
        </div>
      </div>
    );
  }

  const fullAddress = `${address.name}, ${address.line}, ${address.city} - ${address.pincode}`;

  const buildOrderPayload = () => ({
    restaurantId,
    items: items.map((item) => ({ foodId: item.id, quantity: item.quantity })),
    couponCode: coupon?.code || undefined,
    address: {
      name: address.name,
      address: address.line,
      city: address.city,
      pincode: address.pincode,
    },
  });

  const handleCodOrder = async () => {
    setPlacingOrder(true);
    setError(null);
    try {
      const res = await ordersApi.create({
        ...buildOrderPayload(),
        paymentMethod: "COD",
      });
      clearCart();
      router.push(`/order-success?orderId=${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleRazorpaySuccess = async (details: RazorpaySuccessDetails) => {
    setPlacingOrder(true);
    setError(null);
    try {
      const res = await ordersApi.create({
        ...buildOrderPayload(),
        paymentMethod: "RAZORPAY",
        razorpayOrderId: details.razorpayOrderId,
        razorpayPaymentId: details.paymentId,
        razorpaySignature: details.razorpaySignature,
      });
      clearCart();
      router.push(`/order-success?orderId=${res.data.id}`);
    } catch (err) {
      // Payment already succeeded and was verified at this point — this
      // failure is "order couldn't be saved", not "payment failed", so
      // don't let the user re-pay. Surface it clearly instead.
      setError(
        err instanceof Error
          ? `Payment succeeded but the order could not be saved: ${err.message}. Contact support with payment ID ${details.paymentId}.`
          : "Payment succeeded but the order could not be saved. Contact support."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body">
      {fontStyles}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#8A8578] mb-1">
            {restaurantName}
          </p>
          <h1 className="font-display text-3xl font-semibold text-[#1C1B1A]">
            Checkout
          </h1>
        </div>

        <section className="bg-white border border-[#E7E1D3] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-[#1C1B1A]">
              Delivery address
            </h2>
            <button
              onClick={() => setEditingAddress((e) => !e)}
              className="text-sm text-[#B8481E] hover:text-[#8f3717] font-medium"
            >
              {editingAddress ? "Done" : "Edit"}
            </button>
          </div>

          {editingAddress ? (
            <div className="space-y-2">
              <input
                value={address.name}
                onChange={(e) => setAddress({ ...address, name: e.target.value })}
                placeholder="Name"
                className="w-full border border-[#E7E1D3] rounded-md px-3 py-2 text-sm text-[#1C1B1A] outline-none focus:border-[#B8481E] transition-colors"
              />
              <input
                value={address.line}
                onChange={(e) => setAddress({ ...address, line: e.target.value })}
                placeholder="Address"
                className="w-full border border-[#E7E1D3] rounded-md px-3 py-2 text-sm text-[#1C1B1A] outline-none focus:border-[#B8481E] transition-colors"
              />
              <input
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder="City"
                className="w-full border border-[#E7E1D3] rounded-md px-3 py-2 text-sm text-[#1C1B1A] outline-none focus:border-[#B8481E] transition-colors"
              />
              <input
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                placeholder="Pincode"
                className="w-full border border-[#E7E1D3] rounded-md px-3 py-2 text-sm text-[#1C1B1A] outline-none focus:border-[#B8481E] transition-colors"
              />
              <p className="text-xs text-[#8A8578] pt-1">
                Saved automatically for next time.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#5B6660]">{fullAddress}</p>
          )}
        </section>

        <section className="bg-white border border-[#E7E1D3] rounded-lg p-4">
          <h2 className="font-display font-semibold text-[#1C1B1A] mb-2">
            Order items <span className="text-[#8A8578] font-body font-normal text-sm">({restaurantName})</span>
          </h2>
          <ul className="text-sm divide-y divide-[#EFEAE0]">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between py-1.5 text-[#1C1B1A]">
                <span>
                  {item.name} <span className="text-[#8A8578]">× {item.quantity}</span>
                </span>
                <span className="font-data">₹{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
        </section>

        <CartSummary />

        <section className="bg-white border border-[#E7E1D3] rounded-lg p-4">
          <h2 className="font-display font-semibold text-[#1C1B1A] mb-2">
            Payment method
          </h2>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2.5 border border-[#E7E1D3] rounded-md px-3 py-2.5 cursor-pointer has-[:checked]:border-[#B8481E] has-[:checked]:bg-[#FBF3EC] transition-colors">
              <input
                type="radio"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
                className="accent-[#B8481E]"
              />
              <span className="text-[#1C1B1A]">Pay online (Razorpay)</span>
            </label>
            <label className="flex items-center gap-2.5 border border-[#E7E1D3] rounded-md px-3 py-2.5 cursor-pointer has-[:checked]:border-[#B8481E] has-[:checked]:bg-[#FBF3EC] transition-colors">
              <input
                type="radio"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="accent-[#B8481E]"
              />
              <span className="text-[#1C1B1A]">Cash on delivery</span>
            </label>
          </div>
        </section>

        {error && (
          <p className="text-sm text-[#B8481E] bg-[#FBF3EC] border border-[#F0D9C8] rounded-md px-3 py-2.5">
            {error}
          </p>
        )}

        {paymentMethod === "razorpay" ? (
          <RazorpayCheckout
            amount={totals.grandTotal}
            name="TastyGo"
            description={`Order from ${restaurantName}`}
            receipt={`${restaurantId}_${Date.now()}`}
            prefillName={address.name}
            onSuccess={handleRazorpaySuccess}
            onFailure={() => setError("Payment failed. Please try again.")}
          />
        ) : (
          <button
            onClick={handleCodOrder}
            disabled={placingOrder}
            className="w-full bg-[#B8481E] text-white font-medium py-3 rounded-md hover:bg-[#8f3717] disabled:opacity-60 transition-colors"
          >
            {placingOrder ? "Placing order..." : "Place order"}
          </button>
        )}
      </div>
    </div>
  );
}