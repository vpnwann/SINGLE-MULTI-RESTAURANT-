"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "../../../lib/api";
import Modal from "../../../components/Modal";

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

export default function RestaurantFoodPage() {
  const { id } = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [r, f] = await Promise.all([
        api.get(`/api/admin/restaurants/${id}`),
        api.get(`/api/admin/restaurants/${id}/food`),
      ]);
      setRestaurant(r.data);
      setItems(f.data);
    } catch (err) {
      setError(err.message);
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
    setEditing(item);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
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
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (item) => {
    const nextValue = !(item.available ?? true);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, available: nextValue } : i)));
    try {
      await api.patch(`/api/admin/food/${item.id}/availability`, { available: nextValue });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update");
      load();
    }
  };

  const remove = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.del(`/api/admin/food/${item.id}`);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <button
        onClick={() => router.push("/admin/restaurants")}
        className="btn"
        style={{ border: "none", background: "none", padding: 0, color: "var(--text-mute)", marginBottom: 14, fontSize: 12.5 }}
      >
        ← All restaurants
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>{restaurant?.name || "Menu"}</h1>
          <p style={{ color: "var(--text-mute)", fontSize: 13.5 }}>
            {items.length} item{items.length === 1 ? "" : "s"} on the menu
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add item
        </button>
      </div>

      {error && <div style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</div>}

      <div className="table-rail">
        <div
          className="table-rail-row"
          style={{
            gridTemplateColumns: "2fr 1fr 0.7fr 0.6fr 0.9fr auto",
            fontSize: 12,
            color: "var(--text-mute)",
            fontWeight: 600,
          }}
        >
          <div>Item</div>
          <div>Category</div>
          <div>Price</div>
          <div>Veg</div>
          <div>Available</div>
          <div />
        </div>

        {loading && <div style={{ padding: 20, color: "var(--text-mute)" }}>Loading…</div>}
        {!loading && items.length === 0 && (
          <div style={{ padding: 20, color: "var(--text-mute)" }}>No items yet — add the first one.</div>
        )}

        {items.map((item) => {
          const isVeg = item.is_veg ?? item.isVeg;
          const available = item.available ?? true;
          return (
            <div
              key={item.id}
              className="table-rail-row"
              style={{ gridTemplateColumns: "2fr 1fr 0.7fr 0.6fr 0.9fr auto" }}
            >
              <div style={{ fontWeight: 500 }}>{item.name}</div>
              <div style={{ color: "var(--text-mute)" }}>
                {item.category}
                {item.subcategory ? ` · ${item.subcategory}` : ""}
              </div>
              <div className="num">₹{item.price}</div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    border: `1.5px solid ${isVeg ? "var(--success)" : "var(--danger)"}`,
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: 2,
                      borderRadius: "50%",
                      background: isVeg ? "var(--success)" : "var(--danger)",
                    }}
                  />
                </span>
              </div>
              <div>
                <button
                  onClick={() => toggleAvailable(item)}
                  className="badge"
                  style={{
                    border: "none",
                    background: available ? "var(--success-soft)" : "var(--paper-2)",
                    color: available ? "var(--success)" : "var(--text-mute)",
                  }}
                >
                  {available ? "In stock" : "86'd"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button className="btn" style={{ padding: "6px 10px", fontSize: 12.5 }} onClick={() => openEdit(item)}>
                  Edit
                </button>
                <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 12.5 }} onClick={() => remove(item)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing !== null && (
        <Modal title={editing?.id ? "Edit item" : "Add item"} onClose={() => setEditing(null)}>
          <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Price (₹)</label>
                <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Rating</label>
                <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Subcategory</label>
                <input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Image URL</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} />
                Vegetarian
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                Available
              </label>
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing?.id ? "Save changes" : "Add item"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
