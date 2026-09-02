"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "./lib/api";

function StatCard({ label, value, accent }) {
  return (
    <div className="panel" style={{ padding: "18px 20px", flex: 1 }}>
      <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginBottom: 8 }}>
        {label}
      </div>
      <div
        className="display num"
        style={{ fontSize: 28, color: accent ? "var(--accent)" : "var(--ink)" }}
      >
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/orders/stats/summary")
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Overview</h1>
      <p style={{ color: "var(--text-mute)", fontSize: 13.5, marginBottom: 24 }}>
        A quick read on what's happening across the platform right now.
      </p>

      {error && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

      {stats && (
        <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
          <StatCard label="Total orders" value={stats.total_orders} />
          <StatCard
            label="Revenue (paid)"
            value={`₹${Number(stats.total_revenue).toLocaleString("en-IN")}`}
            accent
          />
          <StatCard label="Active orders" value={stats.active_orders} />
          <StatCard label="Failed payments" value={stats.failed_payments} />
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/admin/orders" className="btn">
          View orders →
        </Link>
        <Link href="/admin/restaurants" className="btn">
          Manage restaurants →
        </Link>
        <Link href="/admin/coupons" className="btn">
          Manage coupons →
        </Link>
      </div>
    </div>
  );
}
