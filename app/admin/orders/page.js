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
  if (status === "Paid" && method) return `${method} - Paid`;
  return status;
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Coarse relative time for the row list — precise timestamp still lives in
// the detail panel via toLocaleString.
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Flags an order that's been sitting unactioned past a reasonable window —
// a restaurant/admin cue to chase it up, not a hard rule about SLAs.
const STALE_THRESHOLD_MIN = 15;
function isStale(order) {
  const status = order.order_status ?? order.orderStatus;
  if (status !== "Order Confirmed" || !order.created_at) return false;
  const mins = (Date.now() - new Date(order.created_at).getTime()) / 60000;
  return mins > STALE_THRESHOLD_MIN;
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
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      if (search) params.set("search", search);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
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
  }, [page, statusFilter, paymentFilter, search, dateFrom, dateTo, sortBy, sortDir]);

  // Auto-refresh polls quietly in the background — no loading spinner, so an
  // admin mid-review of a row isn't interrupted every 30s.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => load({ silent: true }), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, page, statusFilter, paymentFilter, search, dateFrom, dateTo, sortBy, sortDir]);

  // Close the open detail panel on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setExpanded(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleSort = (field) => {
    setPage(1);
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — fail silently,
      // the button just won't show the "Copied" confirmation.
    }
  };

  const exportCsv = () => {
    if (orders.length === 0) return;
    const headers = ["Order ID", "Restaurant", "Total", "Order Status", "Payment Status", "Payment Method", "Placed At"];
    const rows = orders.map((o) => [
      o.id,
      o.restaurant_name ?? o.restaurantName ?? "",
      Number(o.total ?? 0).toFixed(2),
      o.order_status ?? o.orderStatus ?? "",
      o.payment_status ?? o.paymentStatus ?? "",
      o.payment_method ?? o.paymentMethod ?? "",
      o.created_at ? new Date(o.created_at).toISOString() : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const hasActiveFilters = statusFilter || paymentFilter || search || dateFrom || dateTo;

  const clearFilters = () => {
    setStatusFilter("");
    setPaymentFilter("");
    setSearchInput("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable} orders-page`}>
      <header className="orders-header">
        <div>
          <h1>Orders</h1>
          <p className="count">{pagination ? `${pagination.total} total` : "\u00A0"}</p>
        </div>
        <div className="header-actions">
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button type="button" className="icon-btn" onClick={() => load()} disabled={loading} title="Refresh now">
            ⟳ Refresh
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={exportCsv}
            disabled={orders.length === 0}
            title="Export the current page as CSV"
          >
            ⬇ Export CSV
          </button>
        </div>
        <div className="filters">
          <input
            type="search"
            aria-label="Search by order ID or restaurant"
            placeholder="Search order # or restaurant…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
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
          <div className="date-range">
            <input
              type="date"
              aria-label="From date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => {
                setPage(1);
                setDateFrom(e.target.value);
              }}
            />
            <span className="date-sep">–</span>
            <input
              type="date"
              aria-label="To date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setPage(1);
                setDateTo(e.target.value);
              }}
            />
          </div>
          {hasActiveFilters && (
            <button type="button" className="clear-filters" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </header>

      {error && <div className="error-banner">{error}. <button onClick={load}>Try again</button></div>}

      <div className="rail">
        <div className="rail-head">
          <span>Order</span>
          <span>Restaurant</span>
          <button type="button" className="sort-head num" onClick={() => toggleSort("total")}>
            Total {sortBy === "total" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
          <button type="button" className="sort-head" onClick={() => toggleSort("created_at")}>
            Placed {sortBy === "created_at" ? (sortDir === "asc" ? "▲" : "▼") : ""}
          </button>
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
            const stale = isStale(o);
            return (
              <div className={`docket ${isOpen ? "is-open" : ""} ${stale ? "is-stale" : ""}`} key={o.id}>
                <div className="rail-row">
                  <span className="order-id">#{o.id}</span>
                  <span className="restaurant">{o.restaurant_name ?? o.restaurantName}</span>
                  <span className="num total">{money(o.total)}</span>
                  <span className="placed" title={o.created_at ? new Date(o.created_at).toLocaleString("en-IN") : ""}>
                    {timeAgo(o.created_at)}
                    {stale && <span className="stale-dot" title={`Awaiting action for over ${STALE_THRESHOLD_MIN}m`} />}
                  </span>
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
                        <strong>
                          Address
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() =>
                              copyToClipboard(
                                typeof o.address === "string" ? o.address : JSON.stringify(o.address),
                                `addr-${o.id}`
                              )
                            }
                          >
                            {copiedId === `addr-${o.id}` ? "Copied" : "Copy"}
                          </button>
                        </strong>
                        <p>{typeof o.address === "string" ? o.address : JSON.stringify(o.address)}</p>
                        {o.address?.phone && (
                          <>
                            <strong>
                              Phone
                              <button
                                type="button"
                                className="copy-btn"
                                onClick={() => copyToClipboard(o.address.phone, `phone-${o.id}`)}
                              >
                                {copiedId === `phone-${o.id}` ? "Copied" : "Copy"}
                              </button>
                            </strong>
                            <p className="mono-line">{o.address.phone}</p>
                          </>
                        )}
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
        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-right: auto;
          margin-left: 8px;
          flex-wrap: wrap;
        }
        .auto-refresh {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: var(--ink-soft);
          cursor: pointer;
          user-select: none;
        }
        .auto-refresh input {
          cursor: pointer;
        }
        .icon-btn {
          font-family: var(--font-body), sans-serif;
          font-size: 12.5px;
          padding: 7px 12px;
          border: 1px solid var(--line);
          border-radius: 2px;
          background: #fff;
          color: var(--ink);
          cursor: pointer;
        }
        .icon-btn:hover:not(:disabled) {
          border-color: var(--ink-soft);
        }
        .icon-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .icon-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
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
        .filters select,
        .filters input[type="search"],
        .filters input[type="date"] {
          font-family: var(--font-body), sans-serif;
          font-size: 13px;
          padding: 8px 12px;
          border: 1px solid var(--line);
          border-radius: 2px;
          background: #fff;
          color: var(--ink);
        }
        .filters input[type="search"] {
          min-width: 200px;
        }
        .filters select:focus-visible,
        .filters input:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .date-range {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .date-range input[type="date"] {
          font-family: var(--font-mono), monospace;
          font-size: 12.5px;
          padding: 7px 8px;
        }
        .date-sep {
          color: var(--ink-soft);
          font-size: 13px;
        }
        .clear-filters {
          font-family: var(--font-body), sans-serif;
          font-size: 12.5px;
          padding: 8px 12px;
          border: 1px solid transparent;
          border-radius: 2px;
          background: none;
          color: var(--accent);
          cursor: pointer;
          text-decoration: underline;
        }
        .clear-filters:focus-visible {
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
          grid-template-columns: 0.6fr 1.2fr 0.8fr 0.8fr 1.5fr 1.2fr auto;
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
        .sort-head {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--ink-soft);
          text-align: left;
          cursor: pointer;
        }
        .sort-head:hover {
          color: var(--ink);
        }
        .sort-head:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .sort-head.num {
          text-align: right;
          justify-self: end;
        }
        .placed {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--ink-soft);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stale-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }
        .docket.is-stale {
          border-left: 3px solid var(--accent);
        }
        .copy-btn {
          font-family: var(--font-body), sans-serif;
          font-size: 10.5px;
          font-weight: 500;
          margin-left: 8px;
          padding: 1px 7px;
          border: 1px solid var(--line);
          border-radius: 2px;
          background: #fff;
          color: var(--ink-soft);
          cursor: pointer;
          text-transform: none;
        }
        .copy-btn:hover {
          border-color: var(--ink-soft);
          color: var(--ink);
        }
        .copy-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
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
          .header-actions {
            margin-left: 0;
            width: 100%;
          }
          .filters {
            width: 100%;
          }
          .filters input[type="search"] {
            width: 100%;
            min-width: 0;
          }
          .rail-head {
            display: none;
          }
          .rail-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 14px 16px;
          }
          .placed {
            order: -1;
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