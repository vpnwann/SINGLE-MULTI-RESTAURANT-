"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import Modal from "../components/Modal";

const TYPES = ["flat", "percentage", "freedel"];
const EMPTY_FORM = { code: "", type: "flat", value: "", maxDiscount: "", description: "" };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/coupons");
      setCoupons(res.data);
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

  const openEdit = (c) => {
    setForm({
      code: c.code,
      type: c.type,
      value: c.value ?? "",
      maxDiscount: c.max_discount ?? c.maxDiscount ?? "",
      description: c.description || "",
    });
    setEditing(c);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        value: form.value === "" ? undefined : Number(form.value),
        maxDiscount: form.maxDiscount === "" ? undefined : Number(form.maxDiscount),
      };
      if (editing?.code) {
        await api.put(`/api/admin/coupons/${editing.code}`, payload);
      } else {
        await api.post(`/api/admin/coupons`, payload);
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await api.del(`/api/admin/coupons/${c.code}`);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Coupons</h1>
          <p style={{ color: "var(--text-mute)", fontSize: 13.5 }}>
            {coupons.length} coupon{coupons.length === 1 ? "" : "s"}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add coupon
        </button>
      </div>

      {error && <div style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</div>}

      <div className="table-rail">
        <div
          className="table-rail-row"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr auto", fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}
        >
          <div>Code</div>
          <div>Type</div>
          <div>Value</div>
          <div>Max discount</div>
          <div>Description</div>
          <div />
        </div>

        {loading && <div style={{ padding: 20, color: "var(--text-mute)" }}>Loading…</div>}
        {!loading && coupons.length === 0 && (
          <div style={{ padding: 20, color: "var(--text-mute)" }}>No coupons yet.</div>
        )}

        {coupons.map((c) => (
          <div key={c.code} className="table-rail-row" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr auto" }}>
            <div className="mono" style={{ fontWeight: 600 }}>{c.code}</div>
            <div style={{ color: "var(--text-mute)", textTransform: "capitalize" }}>{c.type}</div>
            <div className="num">
              {c.type === "percentage" ? `${c.value}%` : c.type === "freedel" ? "—" : `₹${c.value}`}
            </div>
            <div className="num">{c.max_discount ?? c.maxDiscount ? `₹${c.max_discount ?? c.maxDiscount}` : "—"}</div>
            <div style={{ color: "var(--text-mute)" }}>{c.description}</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button className="btn" style={{ padding: "6px 10px", fontSize: 12.5 }} onClick={() => openEdit(c)}>
                Edit
              </button>
              <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 12.5 }} onClick={() => remove(c)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing !== null && (
        <Modal title={editing?.code ? "Edit coupon" : "Add coupon"} onClose={() => setEditing(null)}>
          <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field">
              <label>Code</label>
              <input
                required
                disabled={!!editing?.code}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="mono"
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>{form.type === "percentage" ? "Value (%)" : "Value (₹)"}</label>
                <input
                  type="number"
                  min="0"
                  required={form.type !== "freedel"}
                  disabled={form.type === "freedel"}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Max discount (₹, optional)</label>
              <input type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing?.code ? "Save changes" : "Create coupon"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
