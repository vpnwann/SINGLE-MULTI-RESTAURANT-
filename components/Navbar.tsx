"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Home, UtensilsCrossed, ClipboardList, ShoppingCart } from "lucide-react";

export default function Navbar() {
  const { getItemCount } = useCart();
  const count = getItemCount();
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/restaurants", label: "Restaurants", icon: UtensilsCrossed },
    { href: "/orders", label: "Orders", icon: ClipboardList },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
  ];

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-5xl mx-auto h-16 px-2 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-1 min-w-[70px] h-full text-xs group"
              >
                {/* Active pill background */}
                <span
                  className={`absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl transition-all duration-300 ease-out ${
                    isActive
                      ? "bg-orange-50 scale-100 opacity-100"
                      : "scale-90 opacity-0"
                  }`}
                />

                <span className="relative flex flex-col items-center gap-0.5">
                  <span className="relative">
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.4 : 1.9}
                      className={`transition-all duration-200 ${
                        isActive
                          ? "text-orange-600 -translate-y-0.5"
                          : "text-gray-400 group-hover:text-orange-500"
                      }`}
                    />

                    {item.href === "/cart" && count > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-600 text-white text-[10px] font-semibold flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </span>

                  <span
                    className={`transition-all duration-200 ${
                      isActive
                        ? "text-orange-600 font-semibold"
                        : "text-gray-500 group-hover:text-orange-500 font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
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