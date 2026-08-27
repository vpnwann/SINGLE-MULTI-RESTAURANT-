"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import CartSummary from "@/components/CartSummary";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import { addOrder } from "@/lib/storage";
import { Address, Order, PaymentStatus } from "@/types";

const DEFAULT_ADDRESS: Address = {
  name: "Namit",
  line: "Jaipur, Rajasthan",
  pincode: "302001",
};

type PaymentMethod = "razorpay" | "cod";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, restaurantId, restaurantName, coupon, totals, clearCart } =
    useCart();

  const [address, setAddress] = useState<Address>(DEFAULT_ADDRESS);
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

  const fullAddress = `${address.name}, ${address.line} - ${address.pincode}`;

  const createOrder = (paymentStatus: PaymentStatus) => {
    if (!restaurantId || !restaurantName) return;

    const order: Order = {
      id: `ORD${Date.now()}`,
      restaurantId,
      restaurantName,
      items,
      subtotal: totals.itemTotal,
      deliveryFee: totals.deliveryFee,
      platformFee: totals.platformFee,
      tax: totals.tax,
      discount: totals.discount,
      couponCode: coupon?.code ?? null,
      total: totals.grandTotal,
      address: fullAddress,
      paymentMethod: paymentMethod === "razorpay" ? "Razorpay" : "Cash on Delivery",
      paymentStatus,
      orderStatus: "Order Confirmed",
      createdAt: new Date().toISOString(),
    };

    addOrder(order);
    clearCart();
    router.push(`/order-success?orderId=${order.id}`);
  };

  const handleCodOrder = () => {
    setPlacingOrder(true);
    setError(null);
    setTimeout(() => {
      createOrder("Pending");
      setPlacingOrder(false);
    }, 500);
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
          onSuccess={() => createOrder("Paid")}
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
