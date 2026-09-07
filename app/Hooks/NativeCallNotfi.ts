"use client";

import { useEffect } from "react";

export default function NativeBridge() {
  useEffect(() => {
    console.log("🟢 NativeBridge MOUNTED");

    const handleNativeMessage = (event: Event) => {
      const customEvent = event as CustomEvent;

      console.log("🟣 NATIVE MESSAGE RECEIVED");
      console.log("🟣 DETAIL:", customEvent.detail);

      let data: any;

      try {
        data =
          typeof customEvent.detail === "string"
            ? JSON.parse(customEvent.detail)
            : customEvent.detail;
      } catch (error) {
        console.error("❌ Parse error:", error);
        return;
      }

      console.log("🟣 DATA:", data);

      if (
        data?.type === "PUSH_TOKEN_REGISTERED" &&
        data?.token
      ) {
        console.log(
          "🎯 PUSH TOKEN RECEIVED:",
          data.token
        );

        savePushToken(data.token);
      }
    };

    const savePushToken = async (token: string) => {
      console.log("🚀 CALLING NEXT API WITH TOKEN:", token);

      try {
        const response = await fetch(
          "/api/users/push-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              token,
            }),
          }
        );

        console.log(
          "🚀 NEXT API STATUS:",
          response.status
        );

        const body = await response.text();

        console.log(
          "🚀 NEXT API BODY:",
          body
        );
      } catch (error) {
        console.error(
          "❌ NEXT API ERROR:",
          error
        );
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
    };
  }, []);

  return null;
}