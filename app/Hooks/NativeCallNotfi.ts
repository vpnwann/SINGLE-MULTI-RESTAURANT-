"use client";

import { useEffect } from "react";

/**
 * Listens for messages the React Native WebView shell injects via
 * injectJavaScript (see HomeScreen.tsx -> sendToWebView). Renders nothing;
 * mount it once near the root of the app.
 *
 * Handles:
 * - PUSH_TOKEN_REGISTERED: save the Expo push token against the logged-in user
 *
 * If you already have message handling for RAZORPAY_SUCCESS / RAZORPAY_FAILURE
 * / DEEP_LINK / NOTIFICATION_TAPPED elsewhere, move that logic into this same
 * listener instead of running two "message" listeners side by side.
 */
export default function NativeBridge() {
  useEffect(() => {
    // If the token arrives before the user is logged in, stash it and
    // retry once an auth cookie/session exists. Simple in-memory retry;
    // swap for your actual auth-ready signal if you have one.
    let pendingToken: string | null = null;

    const savePushToken = async (token: string) => {
  console.log("🚀 Saving token to API:", token);

  try {
    const res = await fetch("/api/users/push-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ token }),
    });

    console.log("🚀 API response:", res.status);

    const text = await res.text();
    console.log("🚀 API response body:", text);
  } catch (err) {
    console.error("❌ API error:", err);
  }
};

   const handleMessage = (event: MessageEvent) => {
  console.log("🔥 NativeBridge received:", event.data);

  let data;

  try {
    data =
      typeof event.data === "string"
        ? JSON.parse(event.data)
        : event.data;
  } catch (err) {
    console.log("❌ Could not parse native message:", event.data);
    return;
  }

  console.log("🔥 Parsed native message:", data);

  if (data?.type === "PUSH_TOKEN_REGISTERED" && data.token) {
    console.log("🔥 PUSH TOKEN RECEIVED:", data.token);
    savePushToken(data.token);
  }
};

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}