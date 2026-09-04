"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "./lib/api";

function Icon({ children }) {
  return <div className="dash-icon">{children}</div>;
}

function Arrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function StatCard({ label, value, description, type }) {
  const icons = {
    orders: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M6 2h12v20H6z" />
        <path d="M9 6h6M9 10h6M9 14h4" />
      </svg>
    ),

    revenue: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M15 8.5c-.7-.6-1.7-1-3-1-1.7 0-3 .9-3 2.1 0 3.1 6 1.4 6 4.2 0 1.2-1.3 2.1-3 2.1-1.3 0-2.4-.4-3.1-1.1" />
        <path d="M12 5.5v2M12 16.5v2" />
      </svg>
    ),

    active: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),

    failed: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 8.5 7 7M15.5 8.5l-7 7" />
      </svg>
    ),
  };

  return (
    <div className={`dash-stat dash-stat-${type}`}>
      <div className="dash-stat-top">
        <div className="dash-stat-label">{label}</div>

        <Icon>{icons[type]}</Icon>
      </div>

      <div className="dash-stat-value">{value}</div>

      <div className="dash-stat-bottom">
        <span
          className={`dash-status-dot ${
            type === "failed" ? "danger" : "success"
          }`}
        />

        <span>{description}</span>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="dash-stat">
      <div className="skeleton skeleton-small" />
      <div className="skeleton skeleton-number" />
      <div className="skeleton skeleton-line" />
    </div>
  );
}

function QuickAction({ href, title, description, icon }) {
  return (
    <Link href={href} className="quick-action">
      <div className="quick-action-icon">{icon}</div>

      <div className="quick-action-content">
        <div className="quick-action-title">{title}</div>
        <div className="quick-action-description">{description}</div>
      </div>

      <div className="quick-action-arrow">
        <Arrow />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/orders/stats/summary")
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message || "Unable to load dashboard"));
  }, []);

  return (
    <main className="dashboard">
      <section className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">
            <span className="live-dot" />
            ADMIN CONSOLE
          </div>

          <h1>Overview</h1>

          <p>
            Monitor orders, revenue, restaurants and platform activity
            from one place.
          </p>
        </div>

        <div className="dashboard-date">
          <div className="date-label">TODAY</div>

          <div className="date-value">
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </section>

      {error && (
        <div className="dashboard-error">
          <div className="error-icon">!</div>

          <div>
            <strong>Couldn't load dashboard</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <section className="stats-grid">
        {!stats ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
            <StatCard
              label="TOTAL ORDERS"
              value={stats.total_orders.toLocaleString("en-IN")}
              description="Orders placed"
              type="orders"
            />

            <StatCard
              label="PAID REVENUE"
              value={`₹${Number(stats.total_revenue).toLocaleString(
                "en-IN"
              )}`}
              description="Successfully collected"
              type="revenue"
            />

            <StatCard
              label="ACTIVE ORDERS"
              value={stats.active_orders.toLocaleString("en-IN")}
              description="Currently in progress"
              type="active"
            />

            <StatCard
              label="FAILED PAYMENTS"
              value={stats.failed_payments.toLocaleString("en-IN")}
              description="Payment attempts failed"
              type="failed"
            />
          </>
        )}
      </section>

      <section className="dashboard-columns">
        <div className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-kicker">OPERATIONS</div>
              <h2>Quick actions</h2>
            </div>

            <span className="panel-count">4 modules</span>
          </div>

          <div className="quick-actions">
            <QuickAction
              href="/admin/orders"
              title="Orders"
              description="Review and manage customer orders"
              icon={
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M6 3h12v18H6z" />
                  <path d="M9 7h6M9 11h6M9 15h3" />
                </svg>
              }
            />

            <QuickAction
              href="/admin/restaurants"
              title="Restaurants"
              description="Manage menus and restaurant partners"
              icon={
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M4 10h16M5 10v10h14V10" />
                  <path d="M3 10 5 4h14l2 6" />
                  <path d="M9 20v-6h6v6" />
                </svg>
              }
            />

            <QuickAction
              href="/admin/coupons"
              title="Coupons"
              description="Create and manage promotional offers"
              icon={
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M20 13.5V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6.5a2 2 0 0 1 0 4.5V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4.5Z" />
                  <path d="M9 9h6M9 15h6" />
                </svg>
              }
            />

            <QuickAction
              href="/admin"
              title="Platform"
              description="Review overall platform activity"
              icon={
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M4 19V5M4 19h16" />
                  <path d="m7 15 4-5 3 3 5-7" />
                </svg>
              }
            />
          </div>
        </div>

        <div className="dashboard-panel status-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-kicker">SYSTEM</div>
              <h2>Platform status</h2>
            </div>

            <div className="status-online">
              <span />
              Operational
            </div>
          </div>

          <div className="system-list">
            <div className="system-row">
              <div>
                <strong>Orders API</strong>
                <span>Order processing service</span>
              </div>

              <span className="system-ok">Operational</span>
            </div>

            <div className="system-row">
              <div>
                <strong>Payments</strong>
                <span>Payment processing</span>
              </div>

              <span className="system-ok">Operational</span>
            </div>

            <div className="system-row">
              <div>
                <strong>Restaurant API</strong>
                <span>Menu and restaurant service</span>
              </div>

              <span className="system-ok">Operational</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}