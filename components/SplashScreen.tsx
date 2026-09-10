"use client";

import { useEffect, useRef, useState } from "react";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const EXIT_DURATION = 650;
const SPLASH_DURATION = 3000;

export default function SplashScreen() {
  const [phase, setPhase] = useState("enter"); // "enter" | "exit"
  const [mounted, setMounted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const exitTimer = useRef(null);
  const unmountTimer = useRef(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const handleChange = (e) => setReducedMotion(e.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    exitTimer.current = window.setTimeout(() => {
      setPhase("exit");
    }, SPLASH_DURATION);

    unmountTimer.current = window.setTimeout(() => {
      setMounted(false);
    }, SPLASH_DURATION + EXIT_DURATION);

    return () => {
      window.clearTimeout(exitTimer.current);
      window.clearTimeout(unmountTimer.current);
    };
  }, []);

  if (!mounted) return null;

  const isExiting = phase === "exit";
  const motionClass = reducedMotion ? "motion-reduce-active" : "";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Savour High Street is loading"
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#1A0806] ${motionClass} ${
        isExiting ? "shs-exit-bg" : "shs-enter-bg"
      }`}
    >
      {/* Base cinematic gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_20%,#6B1B1F_0%,#3A0F0E_45%,#1A0806_78%)]" />

      {/* Large blurred gradient orbs */}
      <div className="shs-orb shs-orb-a absolute -left-24 -top-20 h-80 w-80 rounded-full bg-[#E85D3D]/30 blur-[90px] sm:h-[26rem] sm:w-[26rem]" />
      <div className="shs-orb shs-orb-b absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-[#FF8A4C]/25 blur-[100px] sm:h-[30rem] sm:w-[30rem]" />
      <div className="shs-orb shs-orb-c absolute right-10 top-8 h-40 w-40 rounded-full bg-[#FFBE76]/20 blur-[70px] sm:h-56 sm:w-56" />

      {/* Radial glow directly behind the logo */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,190,118,0.22)_0%,rgba(255,190,118,0)_70%)]" />

      {/* Film grain */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay" aria-hidden="true">
        <filter id="shsGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#shsGrain)" />
      </svg>

      {/* Floating ambient particles */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            className="shs-particle absolute block h-[3px] w-[3px] rounded-full bg-[#FFD9AE]"
            style={{
              left: `${8 + i * 9.3}%`,
              top: `${14 + ((i * 37) % 70)}%`,
              animationDelay: `${i * 0.55}s`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      {/* Central content */}
      <div
        className={`relative flex flex-col items-center px-6 text-center ${
          isExiting ? "shs-exit-content" : ""
        }`}
      >
        {/* Floating food elements, orbiting the emblem */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <span className="shs-food shs-food-1 absolute left-[-3.6rem] top-[-1.2rem] text-2xl sm:left-[-4.6rem] sm:text-3xl">🍕</span>
          <span className="shs-food shs-food-2 absolute right-[-3.4rem] top-[0.4rem] text-2xl sm:right-[-4.4rem] sm:text-3xl">🍟</span>
          <span className="shs-food shs-food-3 absolute left-[-3rem] bottom-[-0.6rem] text-2xl sm:left-[-4rem] sm:text-3xl">🍔</span>
          <span className="shs-food shs-food-4 absolute right-[-2.8rem] bottom-[-1rem] text-2xl sm:right-[-3.8rem] sm:text-3xl">🥤</span>
        </div>

        {/* Emblem */}
        <div className="shs-logo relative flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/40 bg-gradient-to-b from-[#FFF8F0] to-[#FFE9D6] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.15)_inset] sm:h-28 sm:w-28">
          <span
            className={`${fraunces.className} shs-breathe select-none text-4xl italic text-[#B23A22] sm:text-5xl`}
            style={{ fontWeight: 600 }}
          >
            S
          </span>
        </div>

        {/* Brand name */}
        <h1
          className={`${fraunces.className} shs-reveal shs-reveal-name mt-7 text-[2.1rem] leading-[1.05] text-[#FFF3E7] sm:text-5xl md:text-6xl`}
          style={{ fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          Savour High Street
        </h1>

        {/* Tagline */}
        <p className="shs-reveal shs-reveal-tagline mt-3 text-[0.8rem] text-[#FFD9AE]/80 sm:text-sm" style={{ letterSpacing: "0.08em" }}>
          Delicious food, delivered to you.
        </p>

        {/* Loading indicator */}
        <div className="shs-reveal shs-reveal-loader mt-10 flex flex-col items-center">
          <div className="h-[3px] w-36 overflow-hidden rounded-full bg-white/10 sm:w-44">
            <div className="shs-shimmer h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#FFD9AE] to-transparent" />
          </div>
          <p className="mt-4 text-[0.7rem] text-white/50" style={{ letterSpacing: "0.06em" }}>
            Preparing your food experience&hellip;
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shsBgFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes shsBgExit {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(1.03);
          }
        }
        @keyframes shsContentExit {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        @keyframes shsLogoIn {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.82);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shsBreathe {
          0%,
          100% {
            filter: drop-shadow(0 0 0 rgba(178, 58, 34, 0));
          }
          50% {
            filter: drop-shadow(0 0 10px rgba(178, 58, 34, 0.25));
          }
        }
        @keyframes shsReveal {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shsOrbDrift {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(2%, -3%) scale(1.06);
          }
        }
        @keyframes shsShimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(340%);
          }
        }
        @keyframes shsParticleFloat {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.25;
          }
          50% {
            transform: translateY(-14px);
            opacity: 0.7;
          }
        }
        @keyframes shsFoodOrbit1 {
          0%,
          100% {
            transform: translate(0, 0) rotate(-4deg);
          }
          50% {
            transform: translate(-4px, -10px) rotate(4deg);
          }
        }
        @keyframes shsFoodOrbit2 {
          0%,
          100% {
            transform: translate(0, 0) rotate(5deg);
          }
          50% {
            transform: translate(5px, -8px) rotate(-5deg);
          }
        }
        @keyframes shsFoodOrbit3 {
          0%,
          100% {
            transform: translate(0, 0) rotate(3deg);
          }
          50% {
            transform: translate(-6px, 8px) rotate(-3deg);
          }
        }
        @keyframes shsFoodOrbit4 {
          0%,
          100% {
            transform: translate(0, 0) rotate(-5deg);
          }
          50% {
            transform: translate(6px, 9px) rotate(5deg);
          }
        }

        .shs-enter-bg {
          animation: shsBgFadeIn 0.4s ease-out both;
        }
        .shs-exit-bg {
          animation: shsBgExit ${EXIT_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .shs-exit-content {
          animation: shsContentExit ${EXIT_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .shs-logo {
          animation: shsLogoIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both,
            shsBreathe 4.5s ease-in-out 1.2s infinite;
        }
        .shs-breathe {
          display: inline-block;
        }
        .shs-reveal {
          opacity: 0;
          animation: shsReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .shs-reveal-name {
          animation-delay: 0.6s;
        }
        .shs-reveal-tagline {
          animation-delay: 0.78s;
        }
        .shs-reveal-loader {
          animation-delay: 1.0s;
        }
        .shs-orb {
          animation: shsOrbDrift 9s ease-in-out infinite;
        }
        .shs-orb-a {
          animation-duration: 10s;
        }
        .shs-orb-b {
          animation-duration: 12s;
          animation-delay: 1s;
        }
        .shs-orb-c {
          animation-duration: 8s;
          animation-delay: 0.4s;
        }
        .shs-particle {
          animation: shsParticleFloat 5s ease-in-out infinite;
        }
        .shs-shimmer {
          animation: shsShimmer 1.6s ease-in-out infinite;
        }
        .shs-food {
          opacity: 0;
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
          animation: shsReveal 0.6s ease-out 0.9s both;
        }
        .shs-food-1 {
          animation: shsReveal 0.6s ease-out 0.9s both, shsFoodOrbit1 6s ease-in-out 1.5s infinite;
        }
        .shs-food-2 {
          animation: shsReveal 0.6s ease-out 1.02s both, shsFoodOrbit2 6.5s ease-in-out 1.6s infinite;
        }
        .shs-food-3 {
          animation: shsReveal 0.6s ease-out 1.14s both, shsFoodOrbit3 7s ease-in-out 1.7s infinite;
        }
        .shs-food-4 {
          animation: shsReveal 0.6s ease-out 1.26s both, shsFoodOrbit4 6.2s ease-in-out 1.8s infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .shs-enter-bg,
          .shs-exit-bg,
          .shs-exit-content,
          .shs-logo,
          .shs-breathe,
          .shs-reveal,
          .shs-orb,
          .shs-particle,
          .shs-shimmer,
          .shs-food,
          .shs-food-1,
          .shs-food-2,
          .shs-food-3,
          .shs-food-4 {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
          .shs-reveal,
          .shs-food {
            opacity: 1;
            transform: none;
          }
        }

        .motion-reduce-active .shs-orb,
        .motion-reduce-active .shs-particle,
        .motion-reduce-active .shs-shimmer,
        .motion-reduce-active .shs-food-1,
        .motion-reduce-active .shs-food-2,
        .motion-reduce-active .shs-food-3,
        .motion-reduce-active .shs-food-4,
        .motion-reduce-active .shs-breathe {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
        }
      `}</style>
    </div>
  );
}