"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { api, ApiError } from "../../../lib/api";
import Modal from "../../../components/Modal";

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

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  image: "",
  category: "",
  subcategory: "",
  isVeg: true,
  rating: "",
  available: true,
};

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RestaurantFoodPage() {
  const { id } = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [r, f] = await Promise.all([
        api.get(`/api/admin/restaurants/${id}`),
        api.get(`/api/admin/restaurants/${id}/food`),
      ]);
      setRestaurant(r.data);
      setItems(f.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this menu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditing({});
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price ?? "",
      image: item.image || "",
      category: item.category || "",
      subcategory: item.subcategory || "",
      isVeg: item.is_veg ?? item.isVeg ?? true,
      rating: item.rating ?? "",
      available: item.available ?? true,
    });
    setFormError("");
    setEditing(item);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        price: form.price === "" ? undefined : Number(form.price),
        rating: form.rating === "" ? undefined : Number(form.rating),
      };
      if (editing?.id) {
        await api.put(`/api/admin/food/${editing.id}`, payload);
      } else {
        await api.post(`/api/admin/restaurants/${id}/food`, payload);
      }
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Save failed. Nothing was changed.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (item) => {
    const previous = item.available ?? true;
    const nextValue = !previous;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, available: nextValue } : i)));
    try {
      await api.patch(`/api/admin/food/${item.id}/availability`, { available: nextValue });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, available: previous } : i)));
      alert(err instanceof ApiError ? err.message : "Failed to update availability. The item was left unchanged.");
    }
  };

  const remove = async (item) => {
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    try {
      await api.del(`/api/admin/food/${item.id}`);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed. The item was left in place.");
    }
  };

  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable} food-page`}>
      <button className="back-link" onClick={() => router.push("/admin/restaurants")}>
        ← All restaurants
      </button>

      <header className="page-header">
        <div>
          <h1>{restaurant?.name || "Menu"}</h1>
          <p className="count">
            {loading ? "\u00A0" : `${items.length} item${items.length === 1 ? "" : "s"} on the menu`}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Add item
        </button>
      </header>

      {error && (
        <div className="error-banner">
          {error}. <button onClick={load}>Try again</button>
        </div>
      )}

      <div className="rail">
        <div className="rail-head">
          <span>Item</span>
          <span>Category</span>
          <span className="num">Price</span>
          <span>Veg</span>
          <span>Available</span>
          <span />
        </div>

        {loading && <div className="empty">Loading menu…</div>}
        {!loading && !error && items.length === 0 && (
          <div className="empty">No items yet — add the first one.</div>
        )}

        {!loading &&
          items.map((item) => {
            const isVeg = item.is_veg ?? item.isVeg;
            const available = item.available ?? true;
            return (
              <div className="rail-row" key={item.id}>
                <span className="item-name">{item.name}</span>
                <span className="category">
                  {item.category || "—"}
                  {item.subcategory ? ` · ${item.subcategory}` : ""}
                </span>
                <span className="num price">{money(item.price)}</span>
                <span>
                  <span className={`veg-dot ${isVeg ? "is-veg" : "is-nonveg"}`} aria-hidden="true" />
                  <span className="sr-only">{isVeg ? "Vegetarian" : "Non-vegetarian"}</span>
                </span>
                <span>
                  <button
                    className={`stock-toggle ${available ? "in-stock" : "eighty-sixed"}`}
                    onClick={() => toggleAvailable(item)}
                  >
                    {available ? "In stock" : "86'd"}
                  </button>
                </span>
                <div className="row-actions">
                  <button className="btn-ghost" onClick={() => openEdit(item)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => remove(item)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {editing !== null && (
        <Modal title={editing?.id ? "Edit item" : "Add item"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className={`${display.variable} ${body.variable} ${mono.variable} food-form`}>
            <div className="field">
              <label htmlFor="ff-name">Name</label>
              <input
                id="ff-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="ff-price">Price (₹)</label>
                <input
                  id="ff-price"
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="ff-rating">Rating</label>
                <input
                  id="ff-rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="ff-category">Category</label>
                <input
                  id="ff-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="ff-subcategory">Subcategory</label>
                <input
                  id="ff-subcategory"
                  value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="ff-image">Image URL</label>
              <input
                id="ff-image"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="ff-description">Description</label>
              <textarea
                id="ff-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.isVeg}
                  onChange={(e) => setForm({ ...form, isVeg: e.target.checked })}
                />
                Vegetarian
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                />
                Available
              </label>
            </div>
            {formError && <div className="form-error">{formError}</div>}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing?.id ? "Save changes" : "Add item"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style jsx global>{`
        .food-page {
          --paper: #edefef;
          --paper-2: #e2e5e4;
          --ink: #14181a;
          --ink-soft: #57615f;
          --line: #c9d0cc;
          --accent: #c4432a;
          --veg: #3e8c4c;
          --nonveg: #c4432a;
          font-family: var(--font-body), -apple-system, sans-serif;
          color: var(--ink);
          background: var(--paper);
          padding: 28px clamp(16px, 4vw, 40px) 48px;
          border-radius: 4px;
        }
        .back-link {
          border: none;
          background: none;
          padding: 0;
          color: var(--ink-soft);
          margin-bottom: 14px;
          font-size: 12.5px;
          font-family: var(--font-body), sans-serif;
          cursor: pointer;
        }
        .back-link:hover {
          color: var(--ink);
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
        .btn-primary,
        .btn-ghost,
        .btn-danger {
          font-family: var(--font-body), sans-serif;
          font-size: 12.5px;
          padding: 8px 14px;
          border-radius: 2px;
          cursor: pointer;
          border: 1px solid transparent;
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
        textarea:focus-visible {
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
          grid-template-columns: 1.8fr 1.2fr 0.7fr 0.5fr 0.9fr auto;
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
        .item-name {
          font-weight: 500;
        }
        .category {
          color: var(--ink-soft);
          font-size: 13.5px;
        }
        .num {
          text-align: right;
        }
        .price {
          font-family: var(--font-mono), monospace;
          font-size: 13.5px;
        }
        .veg-dot {
          display: inline-block;
          width: 13px;
          height: 13px;
          border-radius: 2px;
          position: relative;
          border: 1.5px solid var(--veg);
        }
        .veg-dot.is-nonveg {
          border-color: var(--nonveg);
        }
        .veg-dot::after {
          content: "";
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: var(--veg);
        }
        .veg-dot.is-nonveg::after {
          background: var(--nonveg);
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
        }
        .stock-toggle {
          font-family: var(--font-mono), monospace;
          font-size: 11.5px;
          font-weight: 500;
          padding: 5px 10px;
          border: 1.5px solid;
          border-radius: 2px;
          cursor: pointer;
        }
        .stock-toggle.in-stock {
          color: var(--veg);
          background: #edf6ee;
          border-color: var(--veg);
        }
        .stock-toggle.eighty-sixed {
          color: var(--ink-soft);
          background: var(--paper-2);
          border-color: var(--line);
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

        @media (max-width: 780px) {
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
        .food-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          font-family: var(--font-body), sans-serif;
          color: var(--ink);
          min-width: 320px;
        }
        .food-form .field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .food-form .field-row {
          display: flex;
          gap: 12px;
        }
        .food-form .field-row .field {
          flex: 1;
        }
        .food-form label {
          font-size: 12px;
          color: var(--ink-soft);
        }
        .food-form input,
        .food-form textarea {
          font-family: var(--font-body), sans-serif;
          font-size: 13.5px;
          padding: 8px 10px;
          border: 1px solid var(--line);
          border-radius: 2px;
          background: #fff;
          color: var(--ink);
        }
        .food-form textarea {
          resize: vertical;
        }
        .checkbox-row {
          display: flex;
          gap: 18px;
        }
        .checkbox-row label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--ink);
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