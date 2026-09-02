"use client";

const STYLES = {
  // order statuses
  "Order Confirmed": { bg: "var(--warn-soft)", fg: "var(--warn)" },
  "Restaurant Accepted": { bg: "var(--warn-soft)", fg: "var(--warn)" },
  Preparing: { bg: "var(--warn-soft)", fg: "var(--warn)" },
  "Out for Delivery": { bg: "var(--accent-soft)", fg: "var(--accent)" },
  Delivered: { bg: "var(--success-soft)", fg: "var(--success)" },
  // payment statuses
  Paid: { bg: "var(--success-soft)", fg: "var(--success)" },
  Pending: { bg: "var(--warn-soft)", fg: "var(--warn)" },
  Failed: { bg: "var(--danger-soft)", fg: "var(--danger)" },
};

export default function StatusBadge({ value }) {
  const style = STYLES[value] || { bg: "var(--paper-2)", fg: "var(--text-mute)" };
  return (
    <span className="badge" style={{ background: style.bg, color: style.fg }}>
      {value}
    </span>
  );
}
