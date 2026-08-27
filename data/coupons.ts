import { Coupon } from "@/types";

export const coupons: Coupon[] = [
  {
    code: "WELCOME50",
    type: "flat",
    value: 50,
    description: "Flat ₹50 OFF on your order",
  },
  {
    code: "FOOD20",
    type: "percentage",
    value: 20,
    maxDiscount: 100,
    description: "20% OFF up to ₹100",
  },
  {
    code: "FREEDEL",
    type: "freedel",
    value: 0,
    description: "Free delivery on your order",
  },
];

export function getCouponByCode(code: string): Coupon | undefined {
  return coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
}
