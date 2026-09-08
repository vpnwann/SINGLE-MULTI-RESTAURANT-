"use client";

import { useCallback, useEffect, useState } from "react";

type CarouselImage = {
  id: number;
  image_url: string;
  title: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FormState = {
  imageUrl: string;
  title: string;
  linkUrl: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  imageUrl: "",
  title: "",
  linkUrl: "",
  sortOrder: "0",
  isActive: true,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CarouselAdminPage() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchImages = useCallback(async () => {
    if (!API_URL) {
      setError("NEXT_PUBLIC_API_URL is not configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/carousel`, {
        credentials: "include",
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.message || "Failed to load carousel images.");
      }

      setImages(body.data);
    } catch (err: any) {
      console.error("fetchImages failed:", err);
      setError(err.message || "Something went wrong loading images.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleEdit = (image: CarouselImage) => {
    setEditingId(image.id);
    setForm({
      imageUrl: image.image_url,
      title: image.title || "",
      linkUrl: image.link_url || "",
      sortOrder: String(image.sort_order ?? 0),
      isActive: image.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!API_URL) return;

    if (!form.imageUrl.trim()) {
      setError("Image URL is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      imageUrl: form.imageUrl.trim(),
      title: form.title.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      isActive: form.isActive,
    };

    try {
      const isEdit = editingId !== null;
      const res = await fetch(
        `${API_URL}/api/admin/carousel${isEdit ? `/${editingId}` : ""}`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.message || "Failed to save image.");
      }

      resetForm();
      await fetchImages();
    } catch (err: any) {
      console.error("handleSubmit failed:", err);
      setError(err.message || "Something went wrong saving this image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!API_URL) return;
    if (!window.confirm("Delete this carousel image? This can't be undone.")) {
      return;
    }

    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/carousel/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.message || "Failed to delete image.");
      }

      if (editingId === id) resetForm();
      await fetchImages();
    } catch (err: any) {
      console.error("handleDelete failed:", err);
      setError(err.message || "Something went wrong deleting this image.");
    }
  };

  const handleToggleActive = async (image: CarouselImage) => {
    if (!API_URL) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/carousel/${image.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !image.is_active }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.message || "Failed to update status.");
      }

      await fetchImages();
    } catch (err: any) {
      console.error("handleToggleActive failed:", err);
      setError(err.message || "Something went wrong updating status.");
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Carousel Images</h1>
      <p style={styles.subheading}>
        Manage the home-screen banner carousel. Images are ordered by sort
        order (lowest first).
      </p>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* --- Add / Edit form --- */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.formTitle}>
          {editingId !== null ? `Edit image #${editingId}` : "Add new image"}
        </h2>

        <div style={styles.formGrid}>
          <label style={styles.label}>
            Image URL *
            <input
              style={styles.input}
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://example.com/banner.jpg"
              required
            />
          </label>

          <label style={styles.label}>
            Title
            <input
              style={styles.input}
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="50% off this weekend"
            />
          </label>

          <label style={styles.label}>
            Link URL
            <input
              style={styles.input}
              type="url"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              placeholder="https://example.com/offers"
            />
          </label>

          <label style={styles.label}>
            Sort order
            <input
              style={styles.input}
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
        </div>

        <div style={styles.formActions}>
          <button type="submit" style={styles.primaryButton} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : editingId !== null
              ? "Save changes"
              : "Add image"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={resetForm}
              disabled={isSaving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* --- Image list --- */}
      {isLoading ? (
        <p style={styles.muted}>Loading images...</p>
      ) : images.length === 0 ? (
        <p style={styles.muted}>No carousel images yet.</p>
      ) : (
        <div style={styles.list}>
          {images.map((image) => (
            <div key={image.id} style={styles.card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.image_url}
                alt={image.title || `Carousel image ${image.id}`}
                style={styles.thumbnail}
              />

              <div style={styles.cardBody}>
                <div style={styles.cardTitleRow}>
                  <strong>{image.title || "(untitled)"}</strong>
                  <span
                    style={{
                      ...styles.badge,
                      ...(image.is_active
                        ? styles.badgeActive
                        : styles.badgeInactive),
                    }}
                  >
                    {image.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {image.link_url && (
                  <a
                    href={image.link_url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    {image.link_url}
                  </a>
                )}

                <p style={styles.metaText}>Sort order: {image.sort_order}</p>
              </div>

              <div style={styles.cardActions}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => handleToggleActive(image)}
                >
                  {image.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  style={styles.secondaryButton}
                  onClick={() => handleEdit(image)}
                >
                  Edit
                </button>
                <button
                  style={styles.dangerButton}
                  onClick={() => handleDelete(image.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ACCENT = "#ea580c";

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "32px 20px 80px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  subheading: { color: "#666", marginBottom: 24, fontSize: 14 },
  errorBanner: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  form: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    background: "#fafafa",
  },
  formTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 16,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: "#333",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 500,
    color: "#333",
    alignSelf: "end",
    paddingBottom: 8,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 14,
  },
  formActions: { display: "flex", gap: 10 },
  primaryButton: {
    background: ACCENT,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#fff",
    color: "#333",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
  },
  dangerButton: {
    background: "#fff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
  },
  muted: { color: "#888", fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  card: {
    display: "flex",
    gap: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  thumbnail: {
    width: 120,
    height: 70,
    objectFit: "cover",
    borderRadius: 8,
    background: "#f3f4f6",
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 999,
  },
  badgeActive: { background: "#dcfce7", color: "#166534" },
  badgeInactive: { background: "#f3f4f6", color: "#6b7280" },
  link: {
    fontSize: 12,
    color: ACCENT,
    display: "block",
    marginBottom: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  metaText: { fontSize: 12, color: "#888" },
  cardActions: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flexShrink: 0,
  },
};