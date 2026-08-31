"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/Protected";
import { ordersApi } from "./orderapi";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/calculations";

// Handles the case where address comes back as a jsonb object already,
// or (on some pg setups / legacy rows) as a raw JSON string. Returns
// null if it's neither, so callers can just skip showing phone.
function getPhone(address: Order["address"]): string | null {
  if (!address) return null;
  if (typeof address === "string") {
    try {
      const parsed = JSON.parse(address);
      return parsed?.phone || null;
    } catch {
      return null;
    }
  }
  return (address as { phone?: string }).phone || null;
}

function OrdersPageContent() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        const res = await ordersApi.list();
        if (!cancelled) setOrders(res.data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load orders");
      }
    }

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Couldn&apos;t load your orders</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (orders === null) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center">Loading...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No orders yet</h1>
        <p className="text-gray-500 mb-4">
          You haven&apos;t placed any orders. Start exploring restaurants!
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
      <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
      <div className="space-y-3">
        {orders.map((order) => {
          const phone = getPhone(order.address);
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{order.restaurantName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{order.id}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.items.length} item(s) ·{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  {phone && (
                    <p className="text-xs text-gray-400 mt-1">Phone: {phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(order.total)}</p>
                  <span className="inline-block mt-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}