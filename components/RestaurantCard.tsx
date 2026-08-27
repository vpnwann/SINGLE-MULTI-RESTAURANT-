import Link from "next/link";
import Image from "next/image";
import { Restaurant } from "@/types";

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative w-full h-36 bg-gray-100">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">{restaurant.name}</h3>
          <span className="text-sm bg-green-600 text-white px-1.5 py-0.5 rounded">
            ★ {restaurant.rating}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{restaurant.cuisine}</p>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
          <span>{restaurant.deliveryTime}</span>
          <span>₹{restaurant.priceForTwo} for two</span>
        </div>
      </div>
    </Link>
  );
}
