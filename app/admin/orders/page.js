"use client";

import { useEffect, useState } from "react";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { api, ApiError } from "../lib/api";
import StatusBadge from "../components/StatusBadge";

// Display face for the page title only — everything else stays in the
// workhorse sans/mono pair so the ticket motif reads as functional, not
// decorative.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const ORDER_STATUSES = [
  "Order Confirmed",
  "Restaurant Accepted",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];
const PAYMENT_STATUSES = ["Paid", "Pending", "Failed"];

// Each status gets its own stamp color — ink + a pale wash of the same hue —
// used on the select itself so a row's state is readable at a glance without
// opening it.
const ORDER_STAMP = {
  "Order Confirmed": { ink: "#3E6FA6", wash: "#EAF1F8" },
  "Restaurant Accepted": { ink: "#7A4FA0", wash: "#F3EEF8" },
  Preparing: { ink: "#B8862A", wash: "#FAF3E4" },
  "Out for Delivery": { ink: "#2C8C79", wash: "#E9F5F2" },
  Delivered: { ink: "#3E8C4C", wash: "#EDF6EE" },
};
const PAYMENT_STAMP = {
  Paid: { ink: "#3E8C4C", wash: "#EDF6EE" },
  Pending: { ink: "#B8862A", wash: "#FAF3E4" },
  Failed: { ink: "#C4432A", wash: "#FBEAE7" },
};
const FALLBACK_STAMP = { ink: "#57615F", wash: "#E9EBEA" };

// COD orders start life as payment_status "Pending" — same value an unpaid
// online order would have — but for COD that's not a transient "processing"
// state, it's the expected state until cash changes hands. Surface that
// distinction in the label without touching the underlying value, so the
// backend's Paid/Pending/Failed contract stays untouched.
function paymentLabel(order, status) {
  const method = order.payment_method ?? order.paymentMethod;
  if (status === "Pending" && method === "COD") return "COD - Not Paid";
  return status;
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StampSelect({ value, options, stampMap, onChange, ariaLabel }) {
  const stamp = stampMap[value] || FALLBACK_STAMP;
  // Options can be plain status strings (order status) or {value, label}
  // pairs (payment status, where COD-pending needs different display text
  // than the value actually sent to the backend).
  const normalized = options.map((opt) => (typeof opt === "string" ? { value: opt, label: opt } : opt));
  return (
    <div className="stamp-select">
      <select
        aria-label={ariaLabel}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ color: stamp.ink, background: stamp.wash, borderColor: stamp.ink }}
      >
        {normalized.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="stamp-select-arrow" style={{ color: stamp.ink }} aria-hidden="true">
        ▾
      </span>
      <style jsx>{`
        .stamp-select {
          position: relative;
          display: inline-block;
        }
        select {
          appearance: none;
          font: 500 12.5px var(--font-mono);
          padding: 6px 26px 6px 10px;
          border: 1.5px solid;
          border-radius: 2px;
          cursor: pointer;
        }
        select:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .stamp-select-arrow {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

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
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      const res = await api.get(`/api/admin/orders?${params.toString()}`);
      setOrders(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load orders.");
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
    const previous = order[key];
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, [key]: value } : o)));
    try {
      await api.patch(`/api/admin/orders/${order.id}/status`, { [field]: value });
    } catch (err) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, [key]: previous } : o)));
      alert(err instanceof ApiError ? err.message : "Update failed. The order was left unchanged.");
    }
  };

  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable} orders-page`}>
      <header className="orders-header">
        <div>
          <h1>Orders</h1>
          <p className="count">{pagination ? `${pagination.total} total` : "\u00A0"}</p>
        </div>
        <div className="filters">
          <select
            aria-label="Filter by order status"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by payment status"
            value={paymentFilter}
            onChange={(e) => {
              setPage(1);
              setPaymentFilter(e.target.value);
            }}
          >
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && <div className="error-banner">{error}. <button onClick={load}>Try again</button></div>}

      <div className="rail">
        <div className="rail-head">
          <span>Order</span>
          <span>Restaurant</span>
          <span className="num">Total</span>
          <span>Order status</span>
          <span>Payment</span>
          <span />
        </div>

        {loading && <div className="empty">Loading orders…</div>}
        {!loading && !error && orders.length === 0 && (
          <div className="empty">No orders match these filters.</div>
        )}

        {!loading &&
          orders.map((o) => {
            const orderStatus = o.order_status ?? o.orderStatus;
            const paymentStatus = o.payment_status ?? o.paymentStatus;
            const isOpen = expanded === o.id;
            return (
              <div className={`docket ${isOpen ? "is-open" : ""}`} key={o.id}>
                <div className="rail-row">
                  <span className="order-id">#{o.id}</span>
                  <span className="restaurant">{o.restaurant_name ?? o.restaurantName}</span>
                  <span className="num total">{money(o.total)}</span>
                  <StampSelect
                    ariaLabel={`Order status for order ${o.id}`}
                    value={orderStatus}
                    options={ORDER_STATUSES}
                    stampMap={ORDER_STAMP}
                    onChange={(v) => updateStatus(o, "orderStatus", v)}
                  />
                  <StampSelect
                    ariaLabel={`Payment status for order ${o.id}`}
                    value={paymentStatus}
                    options={PAYMENT_STATUSES.map((s) => ({ value: s, label: paymentLabel(o, s) }))}
                    stampMap={PAYMENT_STAMP}
                    onChange={(v) => updateStatus(o, "paymentStatus", v)}
                  />
                  <button
                    className="details-btn"
                    onClick={() => setExpanded(isOpen ? null : o.id)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? "Hide" : "Details"}
                  </button>
                </div>

                {isOpen && (
                  <div className="docket-detail">
                    <div className="detail-badges">
                      <StatusBadge value={orderStatus} />
                      <span
                        className="pay-badge"
                        style={{
                          color: (PAYMENT_STAMP[paymentStatus] || FALLBACK_STAMP).ink,
                          background: (PAYMENT_STAMP[paymentStatus] || FALLBACK_STAMP).wash,
                        }}
                      >
                        {paymentLabel(o, paymentStatus)}
                      </span>
                      <span className="timestamp">
                        {o.created_at ? new Date(o.created_at).toLocaleString("en-IN") : ""}
                      </span>
                    </div>

                    <div className="detail-grid">
                      <div>
                        <strong>Address</strong>
                        <p>{typeof o.address === "string" ? o.address : JSON.stringify(o.address)}</p>
                      </div>
                      <div>
                        <strong>Payment method</strong>
                        <p>{o.payment_method ?? o.paymentMethod ?? "—"}</p>
                        <strong>Razorpay payment ID</strong>
                        <p className="mono-line">{o.razorpay_payment_id ?? o.razorpayPaymentId ?? "—"}</p>
                      </div>
                    </div>

                    <div className="items-line">
                      <strong>Items</strong>
                      <p>
                        {Array.isArray(o.items)
                          ? o.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")
                          : "—"}
                      </p>
                    </div>

                    <div className="ledger">
                      <span>Subtotal <b>{money(o.subtotal)}</b></span>
                      <span>Delivery <b>{money(o.delivery_fee ?? o.deliveryFee)}</b></span>
                      <span>Tax <b>{money(o.gst ?? o.tax)}</b></span>
                      <span>
                        Discount <b>{money(o.discount ?? 0)}</b>
                        {(o.coupon_code ?? o.couponCode) ? ` (${o.coupon_code ?? o.couponCode})` : ""}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pager">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}

      <style jsx global>{`
        .orders-page {
          --paper: #edefef;
          --paper-2: #e2e5e4;
          --ink: #14181a;
          --ink-soft: #57615f;
          --line: #c9d0cc;
          --accent: #c4432a;
          font-family: var(--font-body), -apple-system, sans-serif;
          color: var(--ink);
          background: var(--paper);
          padding: 28px clamp(16px, 4vw, 40px) 48px;
          border-radius: 4px;
        }
        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .orders-header h1 {
          font-family: var(--font-display), Georgia, serif;
          font-weight: 600;
          font-size: 26px;
          letter-spacing: -0.01em;
          margin: 0 0 4px;
        }
        .count {
          font-family: var(--font-mono), monospace;
          font-size: 12.5px;
          color: var(--ink-soft);
          margin: 0;
        }
        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filters select {
          font-family: var(--font-body), sans-serif;
          font-size: 13px;
          padding: 8px 12px;
          border: 1px solid var(--line);
          border-radius: 2px;
          background: #fff;
          color: var(--ink);
        }
        .filters select:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .error-banner {
          background: #fbeae7;
          border: 1px solid #e3b3a8;
          color: #7a2c1e;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 3px;
          margin-bottom: 16px;
        }
        .error-banner button {
          margin-left: 6px;
          background: none;
          border: none;
          color: #7a2c1e;
          text-decoration: underline;
          cursor: pointer;
          font: inherit;
          padding: 0;
        }
        .rail {
          border: 1px solid var(--line);
          border-radius: 4px;
          overflow: hidden;
          background: #fff;
        }
        .rail-head,
        .rail-row {
          display: grid;
          grid-template-columns: 0.7fr 1.4fr 0.9fr 1.5fr 1.2fr auto;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
        }
        .rail-head {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--ink-soft);
          border-bottom: 1px solid var(--line);
          background: var(--paper-2);
        }
        .docket {
          border-bottom: 1px solid var(--line);
        }
        .docket:last-child {
          border-bottom: none;
        }
        .docket.is-open {
          background: #fbfbfa;
        }
        .order-id,
        .total,
        .mono-line {
          font-family: var(--font-mono), monospace;
        }
        .order-id {
          font-size: 13px;
          color: var(--ink-soft);
        }
        .restaurant {
          font-size: 14px;
        }
        .num {
          text-align: right;
        }
        .total {
          font-size: 13.5px;
        }
        .details-btn {
          justify-self: end;
          font-size: 12.5px;
          font-family: var(--font-body), sans-serif;
          padding: 6px 12px;
          border: 1px solid var(--line);
          border-radius: 2px;
          background: #fff;
          color: var(--ink);
          cursor: pointer;
        }
        .details-btn:hover {
          border-color: var(--ink-soft);
        }
        .details-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .docket-detail {
          padding: 4px 16px 18px 16px;
          border-top: 1px dashed var(--line);
          font-size: 13px;
        }
        .detail-badges {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 14px 0;
        }
        .pay-badge {
          font-family: var(--font-mono), monospace;
          font-size: 11.5px;
          font-weight: 500;
          padding: 3px 9px;
          border-radius: 2px;
        }
        .timestamp {
          margin-left: auto;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--ink-soft);
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 28px;
          margin-bottom: 14px;
        }
        .detail-grid strong,
        .items-line strong,
        .ledger b {
          font-weight: 600;
        }
        .detail-grid strong {
          display: block;
          font-size: 11.5px;
          text-transform: none;
          color: var(--ink-soft);
          margin-bottom: 2px;
        }
        .detail-grid p {
          margin: 0 0 8px;
        }
        .items-line {
          margin-bottom: 14px;
        }
        .items-line strong {
          display: block;
          font-size: 11.5px;
          color: var(--ink-soft);
          margin-bottom: 2px;
        }
        .ledger {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 20px;
          font-family: var(--font-mono), monospace;
          font-size: 12.5px;
          color: var(--ink-soft);
        }
        .empty {
          padding: 32px 16px;
          text-align: center;
          color: var(--ink-soft);
          font-size: 13.5px;
        }
        .pager {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 14px;
          margin-top: 22px;
          font-size: 13px;
        }
        .pager button {
          padding: 8px 14px;
          border: 1px solid var(--line);
          border-radius: 2px;
          background: #fff;
          cursor: pointer;
        }
        .pager button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pager span {
          color: var(--ink-soft);
          font-family: var(--font-mono), monospace;
        }

        @media (max-width: 760px) {
          .rail-head {
            display: none;
          }
          .rail-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 14px 16px;
          }
          .details-btn {
            justify-self: start;
          }
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}