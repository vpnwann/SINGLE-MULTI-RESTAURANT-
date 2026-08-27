"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getOrderById, updateOrderStatus } from "@/lib/storage";
import { Order, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/calculations";

const STATUS_STEPS: OrderStatus[] = [
  "Order Confirmed",
  "Restaurant Accepted",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    // localStorage is only available client-side, so we read the order
    // after mount rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(getOrderById(id) ?? null);
  }, [id]);

  const advanceStatus = () => {
    if (!order) return;
    const currentIndex = STATUS_STEPS.indexOf(order.orderStatus);
    if (currentIndex === -1 || currentIndex === STATUS_STEPS.length - 1) return;
    const nextStatus = STATUS_STEPS[currentIndex + 1];
    const updated = updateOrderStatus(order.id, nextStatus);
    if (updated) setOrder(updated);
  };

  if (order === undefined) {
    return <div className="max-w-xl mx-auto px-4 py-16 text-center">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Order not found</h1>
        <p className="text-gray-500 mb-4">
          We couldn&apos;t find an order with this ID.
        </p>
        <Link href="/orders" className="text-orange-600 hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(order.orderStatus);
  const isDelivered = order.orderStatus === "Delivered";

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link href="/orders" className="text-sm text-orange-600 hover:underline">
        ← Back to orders
      </Link>

      <h1 className="text-2xl font-bold mt-2">{order.restaurantName}</h1>
      <p className="text-xs text-gray-400">{order.id}</p>

      <div className="bg-white border border-gray-200 rounded-lg p-4 my-4">
        <h2 className="font-semibold mb-3">Order Status</h2>
        <ol className="space-y-3">
          {STATUS_STEPS.map((step, idx) => {
            const done = idx <= currentIndex;
            return (
              <li key={step} className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    done
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? "✓" : idx + 1}
                </span>
                <span className={done ? "font-medium" : "text-gray-400"}>
                  {step}
                </span>
              </li>
            );
          })}
        </ol>

        {!isDelivered && (
          <button
            onClick={advanceStatus}
            className="mt-4 w-full bg-orange-600 text-white font-medium py-2.5 rounded-lg hover:bg-orange-700"
          >
            Next Status
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div>
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
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Address</span>
          <span className="font-medium text-right">{order.address}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Payment</span>
          <span className="font-medium">
            {order.paymentMethod} · {order.paymentStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
