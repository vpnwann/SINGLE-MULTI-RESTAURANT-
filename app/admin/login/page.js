"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/request-otp", { email });
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    try {
      await api.post("/api/auth/resend-otp", { email });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", { email, otp });
      if (res.data.role !== "admin") {
        setError("This account doesn't have admin access.");
        setLoading(false);
        return;
      }
      await refresh(); // sync AuthProvider's user state before navigating,
      // otherwise the Gate in admin/layout.js still thinks we're logged out
      // and bounces straight back to /admin/login.
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ink)",
      }}
    >
      <div className="panel" style={{ width: 360, padding: 32 }}>
        <div className="display" style={{ fontSize: 20, marginBottom: 4 }}>
          TastyGo Admin
        </div>
        <div style={{ color: "var(--text-mute)", fontSize: 13, marginBottom: 24 }}>
          {step === "email"
            ? "Sign in with your admin email"
            : `Enter the code sent to ${email}`}
        </div>

        {step === "email" ? (
          <form onSubmit={requestOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label htmlFor="otp">6-digit code</label>
              <input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="mono"
                style={{ letterSpacing: "0.3em", fontSize: 18, textAlign: "center" }}
              />
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Verifying…" : "Verify & sign in"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="btn"
                style={{ border: "none", background: "none", padding: 0, color: "var(--text-mute)" }}
              >
                Use a different email
              </button>
              <button
                type="button"
                onClick={resendOtp}
                className="btn"
                style={{ border: "none", background: "none", padding: 0, color: "var(--accent)" }}
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}