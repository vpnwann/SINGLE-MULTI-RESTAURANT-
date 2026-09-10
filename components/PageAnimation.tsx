"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const animations = [
  {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  },
  {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 16 },
  },
  {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },
  {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 },
  },
];

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const variant = useMemo(
    () => animations[Math.floor(Math.random() * animations.length)],
    [pathname]
  );

  // Respect accessibility setting / low-power mode — just fade, no movement
  const motionProps = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : variant;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={motionProps.initial}
        animate={motionProps.animate}
        exit={motionProps.exit}
        transition={{
          duration: shouldReduceMotion ? 0.15 : 0.22,
          ease: "easeOut",
        }}
        style={{
          width: "100%",
          overflowX: "hidden",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}