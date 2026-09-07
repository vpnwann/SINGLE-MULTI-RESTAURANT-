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
    console.log("🟢 NativeBridge mounted");

    let pendingToken: string | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const savePushToken = async (token: string) => {
      console.log("🚀 Saving push token:", token);

      try {
        // IMPORTANT:
        // This URL must be your Express API, not Next.js /api.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          console.error(
            "❌ NEXT_PUBLIC_API_URL is not configured."
          );
          return;
        }

        const response = await fetch(
          `${apiUrl}/api/users/push-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ token }),
          }
        );

        console.log(
          "🚀 Express push-token status:",
          response.status
        );

        const body = await response.text();

        console.log(
          "🚀 Express push-token response:",
          body
        );

        if (response.status === 401) {
          console.log(
            "⚠️ Authentication failed. Keeping token for retry."
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

        if (!response.ok) {
          console.error(
            "❌ Express rejected push token:",
            response.status,
            body
          );
          return;
        }

        console.log("✅ Push token saved successfully.");

        pendingToken = null;

        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
      } catch (error) {
        console.error(
          "❌ Error sending push token to Express:",
          error
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
      }
    };

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
          "❌ Failed to parse native message:",
          customEvent.detail
        );
        return;
      }

      console.log(
        "🔥 PARSED NATIVE MESSAGE:",
        data
      );

      if (
        data?.type === "PUSH_TOKEN_REGISTERED" &&
        typeof data.token === "string" &&
        data.token.startsWith("ExponentPushToken")
      ) {
        console.log(
          "🎯 PUSH TOKEN RECEIVED:",
          data.token
        );

        pendingToken = data.token;
        savePushToken(data.token);
      }
    };

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
