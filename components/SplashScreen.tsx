"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  if (!showSplash) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-500">
      {/* Background animation */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 animate-pulse" />

      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 animate-pulse" />

      <div className="relative flex flex-col items-center text-center text-white">
        {/* Floating food */}
        <span className="absolute -left-20 top-0 text-3xl animate-bounce">
          🍕
        </span>

        <span className="absolute -right-20 top-8 text-3xl animate-bounce">
          🍟
        </span>

        <span className="absolute -left-16 bottom-2 text-3xl animate-bounce">
          🍔
        </span>

        <span className="absolute -right-16 bottom-0 text-3xl animate-bounce">
          🥤
        </span>

        {/* Logo */}
        <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-white shadow-2xl animate-[logoIn_0.8s_ease-out]">
          <span className="text-6xl animate-bounce">🍔</span>
        </div>

        {/* App name */}
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Savour High Street
        </h1>

        <p className="mt-2 text-sm text-orange-100">
          Delicious food, delivered to you.
        </p>

        {/* Loading */}
        <div className="mt-8 h-1.5 w-32 overflow-hidden rounded-full bg-white/30">
          <div className="h-full w-1/2 rounded-full bg-white animate-[loading_1.2s_ease-in-out_infinite]" />
        </div>

        <p className="mt-3 text-xs text-white/80">
          Preparing your food experience...
        </p>
      </div>
    </div>
  );
}