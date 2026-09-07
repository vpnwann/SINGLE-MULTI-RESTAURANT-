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
      try {
        const res = await fetch("/api/users/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        if (res.status === 401) {
          // Not logged in yet — remember it and try again shortly.
          pendingToken = token;
          setTimeout(() => {
            if (pendingToken) savePushToken(pendingToken);
          }, 5000);
          return;
        }

        if (!res.ok) {
          console.error("Failed to save push token, status:", res.status);
          return;
        }

        pendingToken = null;
      } catch (err) {
        console.error("Failed to save push token:", err);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      let data: any;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return; // not JSON from the native bridge, ignore
      }

      if (data?.type === "PUSH_TOKEN_REGISTERED" && data.token) {
        savePushToken(data.token);
      }

      // Add other native -> web message types here (RAZORPAY_SUCCESS,
      // RAZORPAY_FAILURE, DEEP_LINK, NOTIFICATION_TAPPED) if they aren't
      // already handled by a listener elsewhere in the app.
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}