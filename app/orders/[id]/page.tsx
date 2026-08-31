"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../../components/Protected";
import { ordersApi } from "../orderapi";
import { formatCurrency } from "@/lib/calculations";

// Matches mapOrder() in orderapi.js — the camelCase shape the frontend
// works with, adapted from the raw Postgres row.
type OrderStatus =
  | "Order Confirmed"
  | "Restaurant Accepted"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered";

interface OrderItem {
  foodId: number;
  // `name` and `price` are optional on the type because legacy orders
  // (placed before items were denormalized at order-creation time) only
  // ever persisted {foodId, quantity} — see renderItemLine() below for how
  // those rows are handled without crashing into NaN/blank text.
  name?: string;
  price?: number;
  quantity: number;
}

interface OrderAddress {
  name: string;
  address: string;
  city: string;
  pincode: string;
  phone?: string;
}

interface Order {
  id: number;
  restaurantId: number;
  restaurantName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  discount: number;
  gst: number;
  total: number;
  couponCode: string | null;
  address: OrderAddress | string;
  paymentMethod: "COD" | "RAZORPAY";
  paymentStatus: "Pending" | "Paid";
  orderStatus: OrderStatus;
  createdAt: string;
}

interface ApiError extends Error {
  status?: number;
}

const STATUS_STEPS: OrderStatus[] = [
  "Order Confirmed",
  "Restaurant Accepted",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

// Some pg setups / older rows can hand back the jsonb address column as a
// raw JSON string rather than an already-parsed object. Normalize it here
// so name/phone/etc. always render correctly instead of dumping raw JSON.
function parseAddress(address: OrderAddress | string): OrderAddress | null {
  if (typeof address !== "string") return address;
  try {
    return JSON.parse(address);
  } catch {
    return null; // genuinely not JSON — truly legacy/plain-text address
  }
}

function formatAddress(address: OrderAddress | string): string {
  const parsed = parseAddress(address);
  if (!parsed) return typeof address === "string" ? address : "";
  return `${parsed.name}, ${parsed.address}, ${parsed.city} - ${parsed.pincode}`;
}

// Order date/time, formatted for the user's locale. Falls back to the
// raw string if createdAt is missing or unparsable so we never crash
// the page over a display detail.
function formatOrderDate(createdAt: string | undefined): string {
  if (!createdAt) return "—";
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return createdAt;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Renders a single order-item line, tolerating rows saved before items were
// denormalized with name/price at order-creation time (older orders in the
// DB only have {foodId, quantity}). Rather than computing `undefined *
// undefined` (→ NaN) or rendering a blank name, this falls back to a
// generic label and an explicit "price unavailable" marker so the page
// stays honest instead of showing a wrong or broken number.
function renderItemLine(item: OrderItem) {
  const hasPrice = typeof item.price === "number" && !isNaN(item.price);
  const name = item.name?.trim() ? item.name : `Item #${item.foodId}`;
  const lineTotal = hasPrice ? formatCurrency((item.price as number) * item.quantity) : "—";

  return (
    <li key={item.foodId} className="flex justify-between">
      <span>
        {name} x {item.quantity}
      </span>
      <span className={hasPrice ? "" : "text-gray-400 italic"}>{lineTotal}</span>
    </li>
  );
}

function PaymentStatusBadge({ status }: { status: Order["paymentStatus"] }) {
  const isPaid = status === "Paid";
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {status}
    </span>
  );
}

function OrderTrackingContent({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrder() {
      try {
        const res = await ordersApi.get(id);
        if (!cancelled) setOrder(res.data);
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        if (apiErr.status === 404) {
          setOrder(null);
        } else {
          setError(apiErr.message || "Failed to load order");
        }
      }
    }

    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
  const parsedAddress = parseAddress(order.address);
  const hasLegacyItems = order.items.some(
    (item) => typeof item.price !== "number" || isNaN(item.price) || !item.name
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link href="/orders" className="text-sm text-orange-600 hover:underline">
        ← Back to orders
      </Link>

      <div className="flex items-start justify-between mt-2">
        <div>
          <h1 className="text-2xl font-bold">{order.restaurantName}</h1>
          <p className="text-xs text-gray-400">Order #{order.id}</p>
        </div>
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Placed on {formatOrderDate(order.createdAt)}
      </p>

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

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-sm text-gray-500 mb-1">Items</p>
          <ul className="text-sm space-y-1">
            {order.items.map(renderItemLine)}
          </ul>
          {hasLegacyItems && (
            <p className="text-xs text-gray-400 mt-2">
              Item names/prices aren&apos;t available for this order — see the
              total below for what was charged.
            </p>
          )}
        </div>

        {/* Full price breakdown — subtotal through to the final total,
            so the customer can see exactly what they were charged for. */}
        <div className="border-t border-gray-100 pt-2 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Delivery fee</span>
            <span>{formatCurrency(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Platform fee</span>
            <span>{formatCurrency(order.platformFee)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>GST</span>
            <span>{formatCurrency(order.gst)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>
                Discount{order.couponCode ? ` (${order.couponCode})` : ""}
              </span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Address</span>
          <span className="font-medium text-right">{formatAddress(order.address)}</span>
        </div>
        {parsedAddress?.phone && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Phone</span>
            <span className="font-medium">{parsedAddress.phone}</span>
          </div>
        )}
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

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <OrderTrackingContent id={id} />
    </ProtectedRoute>
  );
}