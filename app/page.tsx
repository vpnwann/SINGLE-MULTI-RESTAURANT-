"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { restaurants } from "@/data/restaurants";
import { categories } from "@/data/categories";
import RestaurantCard from "@/components/RestaurantCard";

export default function HomePage() {
  const [search, setSearch] = useState("");

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <section className="text-center mb-8">
        <h1 className="text-3xl font-bold text-orange-600">SavourHighStreet</h1>
       
        <div className="max-w-md mx-auto mt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants or cuisines..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-3">Shop By Categories</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/restaurants?category=${encodeURIComponent(cat.name)}`}
              className="flex-shrink-0 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm hover:border-orange-400"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Restaurants near you</h2>
          <Link href="/restaurants" className="text-sm text-orange-600 hover:underline">
            View all
          </Link>
        </div>
        {filteredRestaurants.length === 0 ? (
          <p className="text-gray-500 text-sm">No restaurants match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredRestaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
