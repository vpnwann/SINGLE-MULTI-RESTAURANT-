"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import StatusBadge from "../components/StatusBadge";

const ORDER_STATUSES = [
  "Order Confirmed",
  "Restaurant Accepted",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];
const PAYMENT_STATUSES = ["Paid", "Pending", "Failed"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      const res = await api.get(`/api/admin/orders?${params.toString()}`);
      setOrders(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, paymentFilter]);

  const updateStatus = async (order, field, value) => {
    const key = field === "orderStatus" ? "order_status" : "payment_status";
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, [key]: value } : o)));
    try {
      await api.patch(`/api/admin/orders/${order.id}/status`, { [field]: value });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Update failed");
      load();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Orders</h1>
          <p style={{ color: "var(--text-mute)", fontSize: 13.5 }}>
            {pagination ? `${pagination.total} total` : "\u00A0"}
          </p>
          
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 3 }}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPage(1);
              setPaymentFilter(e.target.value);
            }}
            style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 3 }}
          >
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</div>}

      <div className="table-rail">
        <div
          className="table-rail-row"
          style={{
            gridTemplateColumns: "0.9fr 1.4fr 0.9fr 1.3fr 1.3fr auto",
            fontSize: 12,
            color: "var(--text-mute)",
            fontWeight: 600,
          }}
        >
          <div>Order</div>
          <div>Restaurant</div>
          <div>Total</div>
          <div>Order status</div>
          <div>Payment</div>
          <div />
        </div>

        {loading && <div style={{ padding: 20, color: "var(--text-mute)" }}>Loading…</div>}
        {!loading && orders.length === 0 && (
          <div style={{ padding: 20, color: "var(--text-mute)" }}>No orders match these filters.</div>
        )}

        {orders.map((o) => {
          const orderStatus = o.order_status ?? o.orderStatus;
          const paymentStatus = o.payment_status ?? o.paymentStatus;
          const isOpen = expanded === o.id;
          return (
            <div key={o.id}>
              <div
                className="table-rail-row"
                style={{ gridTemplateColumns: "0.9fr 1.4fr 0.9fr 1.3fr 1.3fr auto" }}
              >
                <div className="mono" style={{ fontSize: 12.5 }}>
                  #{o.id}
                </div>
                <div>{o.restaurant_name ?? o.restaurantName}</div>
                <div className="num">₹{o.total}</div>
                <div>
                  <select
                    value={orderStatus}
                    onChange={(e) => updateStatus(o, "orderStatus", e.target.value)}
                    style={{
                      padding: "5px 8px",
                      border: "1px solid var(--line)",
                      borderRadius: 3,
                      fontSize: 12.5,
                      background: "#fff",
                    }}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={paymentStatus}
                    onChange={(e) => updateStatus(o, "paymentStatus", e.target.value)}
                    style={{
                      padding: "5px 8px",
                      border: "1px solid var(--line)",
                      borderRadius: 3,
                      fontSize: 12.5,
                      background: "#fff",
                    }}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button
                    className="btn"
                    style={{ padding: "6px 10px", fontSize: 12.5 }}
                    onClick={() => setExpanded(isOpen ? null : o.id)}
                  >
                    {isOpen ? "Hide" : "Details"}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div
                  style={{
                    background: "var(--paper-2)",
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--line)",
                    fontSize: 12.5,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px 24px",
                  }}
                >
                  <div>
                    <StatusBadge value={orderStatus} /> <StatusBadge value={paymentStatus} />
                  </div>
                  <div style={{ textAlign: "right", color: "var(--text-mute)" }}>
                    {o.created_at ? new Date(o.created_at).toLocaleString() : ""}
                  </div>
                  <div>
                    <strong>Address:</strong> {typeof o.address === "string" ? o.address : JSON.stringify(o.address)}
                  </div>
                  <div>
                 
                    <strong>Payment method:</strong> {o.payment_method ?? o.paymentMethod ?? "—"}
                 <div>
  <strong>Razorpay Payment ID:</strong>{" "}
  <span className="mono">
    {o.razorpay_payment_id ?? o.razorpayPaymentId ?? "—"}
  </span>
</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong>Items:</strong>{" "}
                    {Array.isArray(o.items)
                      ? o.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")
                      : "—"}
                  </div>
                  <div>
                    <strong>Subtotal:</strong> ₹{o.subtotal} &nbsp; <strong>Delivery:</strong> ₹{o.delivery_fee ?? o.deliveryFee} &nbsp;{" "}
                    <strong>Tax:</strong> ₹{o.tax}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong>Discount:</strong> ₹{o.discount ?? 0} {o.coupon_code ?? o.couponCode ? `(${o.coupon_code ?? o.couponCode})` : ""}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <div style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text-mute)" }}>
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <button
            className="btn"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
