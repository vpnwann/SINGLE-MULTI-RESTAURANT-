"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../lib/api";
import Modal from "../components/Modal";

const EMPTY_FORM = {
  name: "",
  cuisine: "",
  rating: "",
  deliveryTime: "",
  priceForTwo: "",
  image: "",
  description: "",
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, {} = create, {...} = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async (q = "") => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/restaurants?limit=100${q ? `&search=${encodeURIComponent(q)}` : ""}`);
      setRestaurants(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing({});
  };

  const openEdit = (r) => {
    setForm({
      name: r.name || "",
      cuisine: r.cuisine || "",
      rating: r.rating ?? "",
      deliveryTime: r.delivery_time || r.deliveryTime || "",
      priceForTwo: r.price_for_two ?? r.priceForTwo ?? "",
      image: r.image || "",
      description: r.description || "",
    });
    setEditing(r);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        rating: form.rating === "" ? undefined : Number(form.rating),
        priceForTwo: form.priceForTwo === "" ? undefined : Number(form.priceForTwo),
      };
      if (editing?.id) {
        await api.put(`/api/admin/restaurants/${editing.id}`, payload);
      } else {
        await api.post(`/api/admin/restaurants`, payload);
      }
      setEditing(null);
      await load(search);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
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
      alert(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Restaurants</h1>
          <p style={{ color: "var(--text-mute)", fontSize: 13.5 }}>
            {restaurants.length} restaurant{restaurants.length === 1 ? "" : "s"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(search)}
            style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 3, width: 200 }}
          />
          <button className="btn btn-primary" onClick={openCreate}>
            + Add restaurant
          </button>
        </div>
      </div>

      {error && <div style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</div>}

      <div className="table-rail">
        <div
          className="table-rail-row"
          style={{
            gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 1fr auto",
            fontSize: 12,
            color: "var(--text-mute)",
            fontWeight: 600,
          }}
        >
          <div>Name</div>
          <div>Cuisine</div>
          <div>Rating</div>
          <div>For two</div>
          <div>Delivery time</div>
          <div />
        </div>

        {loading && <div style={{ padding: 20, color: "var(--text-mute)" }}>Loading…</div>}
        {!loading && restaurants.length === 0 && (
          <div style={{ padding: 20, color: "var(--text-mute)" }}>
            No restaurants yet — add your first one.
          </div>
        )}

        {restaurants.map((r) => (
          <div
            key={r.id}
            className="table-rail-row"
            style={{ gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr 1fr auto" }}
          >
            <div style={{ fontWeight: 500 }}>{r.name}</div>
            <div style={{ color: "var(--text-mute)" }}>{r.cuisine}</div>
            <div className="num">{r.rating ?? "—"}</div>
            <div className="num">
              {(r.price_for_two ?? r.priceForTwo) ? `₹${r.price_for_two ?? r.priceForTwo}` : "—"}
            </div>
            <div style={{ color: "var(--text-mute)" }}>{r.delivery_time ?? r.deliveryTime ?? "—"}</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <Link href={`/admin/restaurants/${r.id}/food`} className="btn" style={{ padding: "6px 10px", fontSize: 12.5 }}>
                Menu
              </Link>
              <button
                className="btn"
                style={{ padding: "6px 10px", fontSize: 12.5 }}
                onClick={() => openEdit(r)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                style={{ padding: "6px 10px", fontSize: 12.5 }}
                onClick={() => remove(r)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing !== null && (
        <Modal title={editing?.id ? "Edit restaurant" : "Add restaurant"} onClose={() => setEditing(null)}>
          <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Cuisine</label>
              <input required value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Rating</label>
                <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Price for two (₹)</label>
                <input type="number" min="0" value={form.priceForTwo} onChange={(e) => setForm({ ...form, priceForTwo: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Delivery time</label>
              <input placeholder="30-40 mins" value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} />
            </div>
            <div className="field">
              <label>Image URL</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing?.id ? "Save changes" : "Create restaurant"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
