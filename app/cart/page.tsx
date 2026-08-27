"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import CartItem from "@/components/CartItem";
import CartSummary from "@/components/CartSummary";

export default function CartPage() {
  const { items, restaurantName, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-4">
          Looks like you haven&apos;t added anything to your cart yet.
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Your Cart</h1>
          {restaurantName && (
            <p className="text-sm text-gray-500">from {restaurantName}</p>
          )}
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-red-600 hover:underline"
        >
          Clear cart
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="mb-4">
        <CartSummary />
      </div>

      <Link
        href="/checkout"
        className="block text-center bg-orange-600 text-white font-medium py-3 rounded-lg hover:bg-orange-700"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
