"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { categories } from "@/data/categories";
import RestaurantCard from "@/components/RestaurantCard";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/restaurants`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        console.log("Restaurants API response:", result);

        // Your backend response:
        // {
        //   success: true,
        //   data: [...]
        // }

        if (!result.success) {
          throw new Error("API returned success: false");
        }

        const restaurantList = Array.isArray(result.data)
          ? result.data
          : [];

        setRestaurants(restaurantList);
      } catch (err) {
        console.error("Restaurant API error:", err);
        setError("Unable to load restaurants.");
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return restaurants;
    }

    return restaurants.filter((restaurant) => {
      const name =
        restaurant.name?.toString().toLowerCase() || "";

      const cuisine =
        restaurant.cuisine?.toString().toLowerCase() || "";

      return (
        name.includes(q) ||
        cuisine.includes(q)
      );
    });
  }, [search, restaurants]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <section className="text-center mb-8">
        <h1 className="text-3xl font-bold text-orange-600">
          SavourHighStreet
        </h1>

        <div className="max-w-md mx-auto mt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants or cuisines..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-orange-500"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-3">
          Shop By Categories
        </h2>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/restaurants?category=${encodeURIComponent(
                cat.name
              )}`}
              className="flex-shrink-0 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm hover:border-orange-400"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Restaurants */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">
            Restaurants near you
          </h2>

          <Link
            href="/restaurants"
            className="text-sm text-orange-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-8 text-center text-gray-500 text-sm">
            Loading restaurants...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-8 text-center">
            <p className="text-red-500 text-sm">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredRestaurants.length === 0 && (
            <p className="text-gray-500 text-sm py-8 text-center">
              {search
                ? "No restaurants match your search."
                : "No restaurants available."}
            </p>
          )}

        {/* Restaurants */}
        {!loading &&
          !error &&
          filteredRestaurants.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                />
              ))}
            </div>
          )}
      </section>
    </div>
  );
}