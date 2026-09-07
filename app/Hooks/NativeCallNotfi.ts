
"use client";

import { useEffect } from "react";

/**
 * Receives messages injected by the React Native WebView shell.
 *
 * React Native -> Next.js:
 *   injectJavaScript()
 *     -> window.dispatchEvent(new CustomEvent("nativeMessage", ...))
 *
 * Handles:
 * - PUSH_TOKEN_REGISTERED
 */
export default function NativeBridge() {
  useEffect(() => {
    let pendingToken: string | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * Save the Expo push token through the Next.js API.
     */
    const savePushToken = async (token: string) => {
      console.log("🚀 Saving push token to API:", token);

      try {
        const res = await fetch("/api/users/push-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            token,
          }),
        });

        console.log("🚀 Push token API status:", res.status);

        const text = await res.text();

        console.log("🚀 Push token API response:", text);

        if (res.status === 401) {
          console.log(
            "⚠️ User is not authenticated yet. Will retry."
          );

          pendingToken = token;

          if (retryTimer) {
            clearTimeout(retryTimer);
          }

          retryTimer = setTimeout(() => {
            if (pendingToken) {
              savePushToken(pendingToken);
            }
          }, 5000);

          return;
        }

        if (!res.ok) {
          console.error(
            "❌ Failed to save push token:",
            res.status,
            text
          );

          return;
        }

        console.log("✅ Expo push token saved successfully.");

        pendingToken = null;

        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
      } catch (error) {
        console.error(
          "❌ Push token API request failed:",
          error
        );

        // Retry network failures.
        pendingToken = token;

        if (retryTimer) {
          clearTimeout(retryTimer);
        }

        retryTimer = setTimeout(() => {
          if (pendingToken) {
            savePushToken(pendingToken);
          }
        }, 5000);
      }
    };

    /**
     * React Native -> Next.js custom event.
     *
     * React Native injects:
     *
     * window.dispatchEvent(
     *   new CustomEvent("nativeMessage", {
     *     detail: JSON.stringify(message)
     *   })
     * )
     */
    const handleNativeMessage = (event: Event) => {
      const customEvent = event as CustomEvent;

      console.log(
        "🔥 NEXT.JS RECEIVED NATIVE MESSAGE:",
        customEvent.detail
      );

      let data: any;

      try {
        const raw = customEvent.detail;

        data =
          typeof raw === "string"
            ? JSON.parse(raw)
            : raw;
      } catch (error) {
        console.error(
          "❌ Could not parse native message:",
          customEvent.detail
        );

        return;
      }

      console.log(
        "🔥 PARSED NATIVE MESSAGE:",
        data
      );

      /**
       * Expo push token
       */
      if (
        data?.type === "PUSH_TOKEN_REGISTERED" &&
        typeof data.token === "string" &&
        data.token.length > 0
      ) {
        console.log(
          "🔥 PUSH TOKEN RECEIVED BY NEXT.JS:",
          data.token
        );

        pendingToken = data.token;

        savePushToken(data.token);
      }
    };

    console.log(
      "✅ NativeBridge mounted and listening for nativeMessage"
    );

    window.addEventListener(
      "nativeMessage",
      handleNativeMessage
    );

    return () => {
      window.removeEventListener(
        "nativeMessage",
        handleNativeMessage
      );

      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, []);

  return null;
}
