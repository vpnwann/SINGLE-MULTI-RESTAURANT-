"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../Auth.context";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailContent() {
  const { verifyEmail, resendVerification } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const t = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await verifyEmail(email, otp);
      router.push("/");
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");

    try {
      const res = await resendVerification(email);
      setInfo(res.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.message || "Could not resend code");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">
        Verify your email
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        We sent a 6-digit code to{" "}
        <span className="font-medium">{email}</span>. Enter it below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Verification code
          </label>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, ""))
            }
            className="w-full border rounded-lg px-3 py-2 tracking-widest text-center text-lg"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {info && (
          <p className="text-sm text-green-600">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || otp.length !== 6}
          className="w-full bg-orange-600 text-white font-medium py-2.5 rounded-lg hover:bg-orange-700 disabled:opacity-60"
        >
          {submitting ? "Verifying..." : "Verify"}
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={cooldown > 0}
        className="text-sm text-orange-600 hover:underline mt-4 disabled:text-gray-400 disabled:no-underline"
      >
        {cooldown > 0
          ? `Resend code in ${cooldown}s`
          : "Resend code"}
      </button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}