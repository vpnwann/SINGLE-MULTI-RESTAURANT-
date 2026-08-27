"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/calculations";

export default function CartSummary({
  showCouponInput = true,
}: {
  showCouponInput?: boolean;
}) {
  const { totals, coupon, couponError, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");

  const handleApply = () => {
    if (!code.trim()) return;
    applyCoupon(code);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {showCouponInput && (
        <div>
          <label className="text-sm font-medium block mb-1">Coupon Code</label>
          {coupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
              <span className="text-sm text-green-700 font-medium">
                {coupon.code} applied — {coupon.description}
              </span>
              <button
                onClick={removeCoupon}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. WELCOME50"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleApply}
                className="bg-gray-900 text-white text-sm font-medium px-4 rounded hover:bg-gray-800"
              >
                Apply
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-sm text-red-600 mt-1">{couponError}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Try: WELCOME50, FOOD20, FREEDEL
          </p>
        </div>
      )}

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Item Total</span>
          <span>{formatCurrency(totals.itemTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Delivery Fee</span>
          <span>{formatCurrency(totals.deliveryFee)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Platform Fee</span>
          <span>{formatCurrency(totals.platformFee)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">GST</span>
          <span>{formatCurrency(totals.tax)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(totals.discount)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-1.5 flex justify-between font-semibold text-base">
          <span>Grand Total</span>
          <span>{formatCurrency(totals.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
