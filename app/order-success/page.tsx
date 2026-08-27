"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/lib/storage";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/calculations";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    // localStorage is only available client-side, so we read the order
    // after mount rather than during render.
    if (!orderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrder(null);
      return;
    }
    setOrder(getOrderById(orderId) ?? null);
  }, [orderId]);

  if (order === undefined) {
    return <div className="max-w-xl mx-auto px-4 py-16 text-center">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Order not found</h1>
        <p className="text-gray-500 mb-4">
          We couldn&apos;t find details for this order.
        </p>
        <Link href="/" className="text-orange-600 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto text-2xl mb-3">
          ✓
        </div>
        <h1 className="text-2xl font-bold">Order Placed!</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your order has been confirmed successfully.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Order ID</span>
          <span className="font-medium">{order.id}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Restaurant</span>
          <span className="font-medium">{order.restaurantName}</span>
        </div>

        <div className="border-t border-gray-100 pt-2">
          <p className="text-sm text-gray-500 mb-1">Items</p>
          <ul className="text-sm space-y-1">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>₹{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
          <span>Total Paid</span>
          <span>{formatCurrency(order.total)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Address</span>
          <span className="font-medium text-right">{order.address}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Payment Status</span>
          <span className="font-medium">{order.paymentStatus}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link
          href={`/orders/${order.id}`}
          className="flex-1 text-center bg-orange-600 text-white font-medium py-3 rounded-lg hover:bg-orange-700"
        >
          View Order
        </Link>
        <Link
          href="/restaurants"
          className="flex-1 text-center border border-gray-300 font-medium py-3 rounded-lg hover:bg-gray-50"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-16 text-center">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
