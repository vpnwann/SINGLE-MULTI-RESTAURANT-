"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/restaurants", label: "Restaurants" },
  { href: "/admin/coupons", label: "Coupons" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: "var(--ink)",
        color: "#f2ede4",
        minHeight: "100vh",
        padding: "22px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "0 8px", marginBottom: 28 }}>
        <div className="display" style={{ color: "#fff", fontSize: 17 }}>
          TastyGo
        </div>
        <div style={{ fontSize: 11, color: "#a89a86", letterSpacing: "0.02em" }}>
          Admin
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "9px 10px",
                borderRadius: 3,
                fontSize: 13.5,
                fontWeight: 500,
                textDecoration: "none",
                color: active ? "#fff" : "#c9bda9",
                background: active ? "rgba(194,65,12,0.35)" : "transparent",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: 14,
          fontSize: 12.5,
          color: "#a89a86",
        }}
      >
        <div style={{ marginBottom: 8, wordBreak: "break-all" }}>{user?.email}</div>
        <button
          onClick={logout}
          className="btn"
          style={{
            background: "transparent",
            borderColor: "rgba(255,255,255,0.18)",
            color: "#f2ede4",
            width: "100%",
            justifyContent: "center",
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
