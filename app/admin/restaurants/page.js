"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { api, ApiError } from "../lib/api";
import Modal from "../components/Modal";

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

// Mirrors the `restaurants` table exactly. There is no price_for_two
// column in the schema — a previous version of this form collected and
// submitted one, which would fail on every save with
// "column \"price_for_two\" does not exist".
const EMPTY_FORM = {
  name: "",
  cuisine: "",
  rating: "",
  deliveryTime: "",
  image: "",
  description: "",
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = create, {...} = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/admin/restaurants?limit=100${q ? `&search=${encodeURIComponent(q)}` : ""}`);
      setRestaurants(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditing({});
  };

  const openEdit = (r) => {
    setForm({
      name: r.name || "",
      cuisine: r.cuisine || "",
      rating: r.rating ?? "",
      deliveryTime: r.delivery_time || r.deliveryTime || "",
      image: r.image || "",
      description: r.description || "",
    });
    setFormError("");
    setEditing(r);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        rating: form.rating === "" ? undefined : Number(form.rating),
      };
      if (editing?.id) {
        await api.put(`/api/admin/restaurants/${editing.id}`, payload);
      } else {
        await api.post(`/api/admin/restaurants`, payload);
      }
      setEditing(null);
      await load(search);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Save failed. Nothing was changed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!confirm(`Delete "${r.name}"? This can't be undone.`)) return;
    try {
      await api.del(`/api/admin/restaurants/${r.id}`);
      await load(search);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed. The restaurant was left in place.");
    }
  };

  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable} restaurants-page`}>
      <header className="page-header">
        <div>
          <h1>Restaurants</h1>
          <p className="count">
            {loading ? "\u00A0" : `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="controls">
          <div className="search-box">
            <input
              placeholder="Search restaurants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(search)}
              aria-label="Search restaurants"
            />
            <button onClick={() => load(search)}>Search</button>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            + Add restaurant
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}. <button onClick={() => load(search)}>Try again</button>
        </div>
      )}

      <div className="rail">
        <div className="rail-head">
          <span>Name</span>
          <span>Cuisine</span>
          <span className="num">Rating</span>
          <span>Delivery time</span>
          <span />
        </div>

        {loading && <div className="empty">Loading restaurants…</div>}
        {!loading && !error && restaurants.length === 0 && (
          <div className="empty">
            {search ? `No restaurants match "${search}".` : "No restaurants yet — add your first one."}
          </div>
        )}

        {!loading &&
          restaurants.map((r) => (
            <div className="rail-row" key={r.id}>
              <span className="name">{r.name}</span>
              <span className="cuisine">{r.cuisine || "—"}</span>
              <span className="num rating">{r.rating != null ? Number(r.rating).toFixed(1) : "—"}</span>
              <span className="delivery">{r.delivery_time ?? r.deliveryTime ?? "—"}</span>
              <div className="row-actions">
                <Link href={`/admin/restaurants/${r.id}/food`} className="btn-ghost">
                  Menu
                </Link>
                <button className="btn-ghost" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => remove(r)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {editing !== null && (
        <Modal title={editing?.id ? "Edit restaurant" : "Add restaurant"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className={`${display.variable} ${body.variable} ${mono.variable} restaurant-form`}>
            <div className="field">
              <label htmlFor="rf-name">Name</label>
              <input
                id="rf-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="rf-cuisine">Cuisine</label>
              <input
                id="rf-cuisine"
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="rf-rating">Rating (0–5)</label>
                <input
                  id="rf-rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="rf-delivery">Delivery time</label>
                <input
                  id="rf-delivery"
                  placeholder="30-40 mins"
                  value={form.deliveryTime}
                  onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="rf-image">Image URL</label>
              <input
                id="rf-image"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="rf-description">Description</label>
              <textarea
                id="rf-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {formError && <div className="form-error">{formError}</div>}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing?.id ? "Save changes" : "Create restaurant"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style jsx global>{`
        .restaurants-page {
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
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .page-header h1 {
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
        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .search-box {
          display: flex;
        }
        .search-box input {
          font-family: var(--font-body), sans-serif;
          font-size: 13px;
          padding: 8px 10px;
          border: 1px solid var(--line);
          border-right: none;
          border-radius: 2px 0 0 2px;
          width: 200px;
          background: #fff;
          color: var(--ink);
        }
        .search-box button {
          font-family: var(--font-body), sans-serif;
          font-size: 12.5px;
          padding: 8px 12px;
          border: 1px solid var(--line);
          border-radius: 0 2px 2px 0;
          background: var(--paper-2);
          color: var(--ink);
          cursor: pointer;
        }
        .btn-primary,
        .btn-ghost,
        .btn-danger {
          font-family: var(--font-body), sans-serif;
          font-size: 12.5px;
          padding: 8px 14px;
          border-radius: 2px;
          cursor: pointer;
          border: 1px solid transparent;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .btn-primary {
          background: var(--accent);
          color: #fff7f2;
          border-color: var(--accent);
        }
        .btn-primary:hover {
          background: #a83a24;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-ghost {
          background: #fff;
          color: var(--ink);
          border-color: var(--line);
          padding: 6px 11px;
        }
        .btn-ghost:hover {
          border-color: var(--ink-soft);
        }
        .btn-danger {
          background: #fff;
          color: var(--accent);
          border-color: #e3b3a8;
          padding: 6px 11px;
        }
        .btn-danger:hover {
          background: #fbeae7;
        }
        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible,
        a:focus-visible {
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
          grid-template-columns: 2fr 1fr 0.7fr 1fr auto;
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
        .rail-row {
          border-bottom: 1px solid var(--line);
        }
        .rail-row:last-child {
          border-bottom: none;
        }
        .name {
          font-weight: 500;
        }
        .cuisine,
        .delivery {
          color: var(--ink-soft);
          font-size: 13.5px;
        }
        .num {
          text-align: right;
        }
        .rating {
          font-family: var(--font-mono), monospace;
        }
        .row-actions {
          display: flex;
          gap: 6px;
          justify-self: end;
        }
        .empty {
          padding: 32px 16px;
          text-align: center;
          color: var(--ink-soft);
          font-size: 13.5px;
        }

        @media (max-width: 720px) {
          .rail-head {
            display: none;
          }
          .rail-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
          .row-actions {
            justify-self: start;
            margin-top: 4px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
          }
        }
      `}</style>
      <style jsx global>{`
        .restaurant-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          font-family: var(--font-body), sans-serif;
          color: var(--ink);
          min-width: 320px;
        }
        .restaurant-form .field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .restaurant-form .field-row {
          display: flex;
          gap: 12px;
        }
        .restaurant-form .field-row .field {
          flex: 1;
        }
        .restaurant-form label {
          font-size: 12px;
          color: var(--ink-soft);
        }
        .restaurant-form input,
        .restaurant-form textarea {
          font-family: var(--font-body), sans-serif;
          font-size: 13.5px;
          padding: 8px 10px;
          border: 1px solid var(--line);
          border-radius: 2px;
          background: #fff;
          color: var(--ink);
        }
        .restaurant-form textarea {
          resize: vertical;
        }
        .form-error {
          background: #fbeae7;
          border: 1px solid #e3b3a8;
          color: #7a2c1e;
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 3px;
        }
        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}