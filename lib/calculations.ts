import { CartItem, CartTotals, Coupon } from "@/types";

export const DELIVERY_FEE = 40;
export const PLATFORM_FEE = 10;
export const GST_RATE = 0.05; // 5% GST

export function getItemTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function calculateDiscount(itemTotal: number, coupon: Coupon | null): number {
  if (!coupon || itemTotal <= 0) return 0;

  if (coupon.type === "flat") {
    return Math.min(coupon.value, itemTotal);
  }

  if (coupon.type === "percentage") {
    const raw = (itemTotal * coupon.value) / 100;
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  }

  // "freedel" coupon has no direct discount on item total
  return 0;
}

export function calculateTotals(items: CartItem[], coupon: Coupon | null): CartTotals {
  const itemTotal = getItemTotal(items);

  if (itemTotal === 0) {
    return {
      itemTotal: 0,
      deliveryFee: 0,
      platformFee: 0,
      tax: 0,
      discount: 0,
      grandTotal: 0,
    };
  }

  const deliveryFee = coupon?.type === "freedel" ? 0 : DELIVERY_FEE;
  const platformFee = PLATFORM_FEE;
  const discount = calculateDiscount(itemTotal, coupon);
  const taxableAmount = Math.max(itemTotal - discount, 0);
  const tax = Math.round(taxableAmount * GST_RATE);

  const grandTotal = Math.max(
    taxableAmount + deliveryFee + platformFee + tax,
    0
  );

  return {
    itemTotal,
    deliveryFee,
    platformFee,
    tax,
    discount,
    grandTotal,
  };
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}
