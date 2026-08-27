"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { CartItem, CartTotals, Coupon, FoodItem } from "@/types";
import { calculateTotals, getItemCount, getItemTotal } from "@/lib/calculations";
import { getCouponByCode } from "@/data/coupons";
import { loadCart, saveCart } from "@/lib/storage";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
}

interface CartContextValue {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  coupon: Coupon | null;
  couponError: string | null;
  totals: CartTotals;
  addToCart: (food: FoodItem, restaurantName: string) => void;
  removeFromCart: (itemId: string) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart on mount. localStorage is only available
  // client-side, so this must happen in an effect rather than during render.
  useEffect(() => {
    const stored = loadCart<CartState>();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(stored.items ?? []);
      setCouponCode(stored.couponCode ?? null);
    }
    setHydrated(true);
  }, []);

  // Persist cart whenever it changes (after initial hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveCart<CartState>({ items, couponCode });
  }, [items, couponCode, hydrated]);

  const addToCart = useCallback((food: FoodItem, restaurantName: string) => {
    setItems((prev) => {
      // If cart has items from a different restaurant, start a fresh cart.
      const isDifferentRestaurant =
        prev.length > 0 && prev[0].restaurantId !== food.restaurantId;
      const base = isDifferentRestaurant ? [] : prev;

      const existing = base.find((i) => i.id === food.id);
      if (existing) {
        return base.map((i) =>
          i.id === food.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      const newItem: CartItem = {
        id: food.id,
        restaurantId: food.restaurantId,
        restaurantName,
        name: food.name,
        price: food.price,
        image: food.image,
        isVeg: food.isVeg,
        quantity: 1,
      };
      return [...base, newItem];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      if (next.length === 0) setCouponCode(null);
      return next;
    });
  }, []);

  const increaseQuantity = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }, []);

  const decreaseQuantity = useCallback((itemId: string) => {
    setItems((prev) => {
      const next = prev
        .map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0);
      if (next.length === 0) setCouponCode(null);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode(null);
    setCouponError(null);
  }, []);

  const applyCoupon = useCallback(
    (code: string) => {
      const found = getCouponByCode(code);
      if (!found) {
        setCouponError("Invalid coupon code.");
        return;
      }
      if (items.length === 0) {
        setCouponError("Add items to your cart before applying a coupon.");
        return;
      }
      setCouponCode(found.code);
      setCouponError(null);
    },
    [items]
  );

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
    setCouponError(null);
  }, []);

  const coupon = useMemo(
    () => (couponCode ? getCouponByCode(couponCode) ?? null : null),
    [couponCode]
  );

  const totals = useMemo(() => calculateTotals(items, coupon), [items, coupon]);

  const restaurantId = items[0]?.restaurantId ?? null;
  const restaurantName = items[0]?.restaurantName ?? null;

  const value: CartContextValue = {
    items,
    restaurantId,
    restaurantName,
    coupon,
    couponError,
    totals,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    getCartTotal: () => getItemTotal(items),
    getItemCount: () => getItemCount(items),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
