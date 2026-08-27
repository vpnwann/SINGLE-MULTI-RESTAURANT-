"use client";

import Image from "next/image";
import { FoodItem } from "@/types";
import { useCart } from "@/context/CartContext";

export default function FoodCard({
  food,
  restaurantName,
}: {
  food: FoodItem;
  restaurantName: string;
}) {
  const { items, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const cartItem = items.find((i) => i.id === food.id);

  return (
    <div className="flex gap-3 bg-white border border-gray-200 rounded-lg p-3">
      <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
        <Image
          src={food.image}
          alt={food.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-start gap-2">
          <span
            className={`mt-1 inline-block w-3 h-3 border-2 flex-shrink-0 ${
              food.isVeg ? "border-green-600" : "border-red-600"
            }`}
            aria-label={food.isVeg ? "Veg" : "Non-veg"}
          >
            <span
              className={`block w-full h-full rounded-full scale-50 ${
                food.isVeg ? "bg-green-600" : "bg-red-600"
              }`}
            />
          </span>
          <h4 className="font-medium">{food.name}</h4>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2">{food.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold">₹{food.price}</span>
          {!food.available ? (
            <span className="text-xs text-gray-400">Not available</span>
          ) : cartItem ? (
            <div className="flex items-center gap-2 bg-orange-600 text-white rounded px-2 py-1">
              <button
                onClick={() => decreaseQuantity(food.id)}
                className="w-5 h-5 flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="text-sm w-4 text-center">{cartItem.quantity}</span>
              <button
                onClick={() => increaseQuantity(food.id)}
                className="w-5 h-5 flex items-center justify-center"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(food, restaurantName)}
              className="text-sm font-medium border border-orange-600 text-orange-600 rounded px-3 py-1 hover:bg-orange-50"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
