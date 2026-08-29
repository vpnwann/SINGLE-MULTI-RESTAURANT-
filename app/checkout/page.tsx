"use client";

import { useState } from "react";
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

type PaymentMethod = "razorpay" | "cod";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, restaurantId, restaurantName, coupon, totals, clearCart } = useCart();

  const [address, setAddress] = useState<AddressForm>(DEFAULT_ADDRESS);
  const [editingAddress, setEditingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-4">
          Add some items to your cart before checking out.
        </p>
        <Link
          href="/restaurants"
          className="inline-block bg-orange-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-orange-700"
        >
          Browse restaurants
        </Link>
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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Delivery Address</h2>
          <button
            onClick={() => setEditingAddress((e) => !e)}
            className="text-sm text-orange-600 hover:underline"
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
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              value={address.line}
              onChange={(e) => setAddress({ ...address, line: e.target.value })}
              placeholder="Address"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              placeholder="City"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              value={address.pincode}
              onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
              placeholder="Pincode"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-600">{fullAddress}</p>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Order Items ({restaurantName})</h2>
        <ul className="text-sm divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between py-1.5">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>₹{item.price * item.quantity}</span>
            </li>
          ))}
        </ul>
      </section>

      <CartSummary />

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Payment Method</h2>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={paymentMethod === "razorpay"}
              onChange={() => setPaymentMethod("razorpay")}
            />
            Pay online (Razorpay)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
            />
            Cash on Delivery
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

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
          className="w-full bg-orange-600 text-white font-medium py-3 rounded-lg hover:bg-orange-700 disabled:opacity-60"
        >
          {placingOrder ? "Placing order..." : "Place Order"}
        </button>
      )}
    </div>
  );
}