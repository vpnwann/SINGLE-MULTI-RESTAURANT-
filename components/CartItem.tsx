"use client";

import Image from "next/image";
import { CartItem as CartItemType } from "@/types";
import { useCart } from "@/context/CartContext";

export default function CartItem({ item }: { item: CartItemType }) {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
      <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{item.name}</h4>
        <p className="text-sm text-gray-500">₹{item.price} each</p>
      </div>
      <div className="flex items-center gap-2 bg-orange-600 text-white rounded px-2 py-1">
        <button
          onClick={() => decreaseQuantity(item.id)}
          className="w-5 h-5 flex items-center justify-center"
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span className="text-sm w-4 text-center">{item.quantity}</span>
        <button
          onClick={() => increaseQuantity(item.id)}
          className="w-5 h-5 flex items-center justify-center"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <span className="font-semibold w-16 text-right">
        ₹{item.price * item.quantity}
      </span>
      <button
        onClick={() => removeFromCart(item.id)}
        className="text-sm text-red-600 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
