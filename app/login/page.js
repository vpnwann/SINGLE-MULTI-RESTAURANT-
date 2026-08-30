"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../Auth.context";

const RESEND_SECONDS = 60;

function TicketEdge({ flip = false }) {
  // Die-cut perforated edge: dashed line + punch-hole notches on both ends,
  // like the tear-strip on a kitchen order ticket.
  return (
    <div className={`relative h-4 ${flip ? "rotate-180" : ""}`} aria-hidden="true">
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-[#C9C2B4]" />
      <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F2EFE8]" />
      <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F2EFE8]" />
    </div>
  );
}

function OtpInput({ value, onChange, onComplete }) {
  const digits = value.split("");
  while (digits.length < 6) digits.push("");
  const refs = useRef([]);

  const setDigit = (index, char) => {
    const next = [...digits];
    next[index] = char;
    const joined = next.join("").slice(0, 6);
    onChange(joined);
    if (char && index < 5) refs.current[index + 1]?.focus();
    if (joined.length === 6) onComplete?.(joined);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    if (pasted.length === 6) {
      refs.current[5]?.focus();
      onComplete?.(pasted);
    } else {
      refs.current[pasted.length]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-0" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <div key={i} className="flex items-center">
          <input
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value.replace(/\D/g, "").slice(-1))}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
            className="h-14 w-11 border-2 border-[#1C1A17]/15 bg-transparent text-center font-mono text-2xl font-bold text-[#1C1A17] focus:border-[#D6432B] focus:outline-none"
            aria-label={`Digit ${i + 1} of 6`}
          />
          {i < 5 && <div className="h-8 w-px border-l-2 border-dashed border-[#C9C2B4]" />}
        </div>
      ))}
    </div>
  );
}

function LoginContent() {
  const { requestOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/cart";

  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const startCooldown = () => setCooldown(RESEND_SECONDS);

  const submitOtp = async (code) => {
    setError("");
    setSubmitting(true);
    try {
      await verifyOtp(email, code);
      router.push(redirectTo);
    } catch (err) {
      setError(err.message || "That code didn't match. Please try again.");
      setOtp("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await requestOtp(email);
      setStep("otp");
      startCooldown();
    } catch (err) {
      setError(err.message || "Couldn't send a code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      await requestOtp(email);
      startCooldown();
    } catch (err) {
      setError(err.message || "Couldn't resend the code. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2EFE8] px-4 py-10">
      <div className="motion-safe:animate-[fadeUp_0.5s_ease-out] w-full max-w-sm">
        <div className="overflow-hidden rounded-sm bg-[#FBF7F0] shadow-[0_1px_0_rgba(0,0,0,0.04),0_20px_40px_-24px_rgba(28,26,23,0.35)]">
          <TicketEdge />

          <div className="px-7 pb-8 pt-2">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#4B6350]">
                TastyGo
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1C1A17]/40">
                {step === "email" ? "Order 01" : "Order 02"}
              </span>
            </div>

            {step === "email" && (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#1C1A17]">
                    Sign in to order
                  </h1>
                  <p className="mt-1.5 text-sm text-[#1C1A17]/60">
                    Enter your email and we&apos;ll send a code. No password needed.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[#1C1A17]/50"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                    className="w-full border-b-2 border-[#1C1A17]/15 bg-transparent py-2 text-base text-[#1C1A17] placeholder:text-[#1C1A17]/30 focus:border-[#D6432B] focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="rounded-sm bg-[#D6432B]/10 px-3 py-2 text-sm text-[#D6432B]" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-sm bg-[#D6432B] py-3.5 font-mono text-sm font-bold uppercase tracking-[0.1em] text-[#FBF7F0] transition-colors hover:bg-[#B93A25] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D6432B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] disabled:opacity-50"
                >
                  {submitting ? "Sending code…" : "Send code"}
                </button>
              </form>
            )}

            {step === "otp" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#1C1A17]">
                    Check your email
                  </h1>
                  <p className="mt-1.5 text-sm text-[#1C1A17]/60">
                    We sent a 6-digit code to <span className="font-medium text-[#1C1A17]">{email}</span>
                  </p>
                </div>

                <OtpInput value={otp} onChange={setOtp} onComplete={submitOtp} />

                {error && (
                  <p className="rounded-sm bg-[#D6432B]/10 px-3 py-2 text-center text-sm text-[#D6432B]" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => submitOtp(otp)}
                  disabled={submitting || otp.length !== 6}
                  className="w-full rounded-sm bg-[#1C1A17] py-3.5 font-mono text-sm font-bold uppercase tracking-[0.1em] text-[#FBF7F0] transition-colors hover:bg-[#1C1A17]/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1A17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F0] disabled:opacity-40"
                >
                  {submitting ? "Verifying…" : "Verify & sign in"}
                </button>

                <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.08em]">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setError("");
                    }}
                    className="text-[#1C1A17]/40 hover:text-[#1C1A17]/70"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="text-[#4B6350] hover:text-[#38493F] disabled:text-[#1C1A17]/30"
                  >
                    {cooldown > 0 ? `Resend in 0:${String(cooldown).padStart(2, "0")}` : "Resend code"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <TicketEdge flip />
        </div>

        <p className="mt-6 text-center text-xs text-[#1C1A17]/35">
          By continuing you agree to TastyGo&apos;s terms &amp; privacy policy.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F2EFE8]" />}>
      <LoginContent />
    </Suspense>
  );
}