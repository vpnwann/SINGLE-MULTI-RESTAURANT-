"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { getItemCount } = useCart();
  const count = getItemCount();
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: "⌂",
    },
    {
      href: "/restaurants",
      label: "Restaurants",
      icon: "🍴",
    },
    {
      href: "/orders",
      label: "Orders",
      icon: "▣",
    },
    {
      href: "/cart",
      label: "Cart",
      icon: "🛒",
    },
  ];

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-5xl mx-auto h-16 px-4 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[70px] h-full text-xs transition-colors ${
                  isActive
                    ? "text-orange-600 font-semibold"
                    : "text-gray-500 hover:text-orange-600"
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>

                <span>{item.label}</span>

                {item.href === "/cart" && count > 0 && (
                  <span className="absolute top-1 right-3 min-w-5 h-5 px-1 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Prevent content from being hidden behind bottom nav */}
      <div className="h-16" />
    </>
  );
}