"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { categories } from "@/data/categories";
import RestaurantCard from "@/components/RestaurantCard";

// Cycling accent set for the category rail — echoes striped market awnings
const ACCENTS = ["#B8481E", "#D8A312", "#5B6660"];

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
    <div className="min-h-screen bg-[#F6F1E7]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap");
        .font-display {
          font-family: "Fraunces", serif;
          font-optical-sizing: auto;
        }
        .font-body {
          font-family: "Work Sans", sans-serif;
        }
        .font-data {
          font-family: "IBM Plex Mono", monospace;
        }
      `}</style>

      {/* Header band */}
      <header className="bg-[#1C1B1A] font-body">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-8">
          <div className="flex items-baseline gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B8481E]" />
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9C4B8]">
              On the high street
            </p>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F6F1E7] mt-2">
            SavourHighStreet
          </h1>

          <p className="text-sm text-[#9C978A] mt-1">
            Order from the kitchens on your doorstep.
          </p>

          <div className="max-w-md mt-6 relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C978A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 1 1 4 10.5a6.5 6.5 0 0 1 13 0Z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants or cuisines"
              className="w-full bg-[#26241F] text-[#F6F1E7] placeholder:text-[#8A8578] rounded-md pl-10 pr-4 py-3 text-sm outline-none border border-[#3A3730] focus:border-[#B8481E] transition-colors"
            />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 font-body">
        {/* Categories */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-[#1C1B1A] mb-3">
            Shop by category
          </h2>

          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                href={`/restaurants?category=${encodeURIComponent(
                  cat.name
                )}`}
                className="flex-shrink-0 bg-white rounded-md px-4 py-2 text-sm text-[#1C1B1A] border-t-[3px] border-x border-b border-[#E7E1D3] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                style={{ borderTopColor: ACCENTS[i % ACCENTS.length] }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Restaurants */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#1C1B1A]">
                Restaurants near you
              </h2>
              {!loading && !error && (
                <p className="font-data text-xs text-[#8A8578] mt-0.5">
                  {filteredRestaurants.length}{" "}
                  {filteredRestaurants.length === 1 ? "spot" : "spots"} open
                </p>
              )}
            </div>

            <Link
              href="/restaurants"
              className="text-sm font-medium text-[#B8481E] hover:text-[#8f3717] transition-colors"
            >
              View all →
            </Link>
          </div>

          {/* Loading — skeleton cards instead of a bare message */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#E7E1D3] bg-white overflow-hidden animate-pulse"
                >
                  <div className="h-32 bg-[#EDE7D9]" />
                  <div className="p-4 space-y-2">
                    <div className="h-3.5 w-3/4 bg-[#EDE7D9] rounded" />
                    <div className="h-3 w-1/2 bg-[#EDE7D9] rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="py-10 px-6 text-center bg-white rounded-lg border border-[#E7E1D3]">
              <p className="font-display text-base text-[#1C1B1A] mb-1">
                Something didn't load
              </p>
              <p className="text-sm text-[#8A8578] mb-4">{error}</p>

              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[#B8481E] text-white rounded-md text-sm font-medium hover:bg-[#8f3717] transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            filteredRestaurants.length === 0 && (
              <div className="py-10 text-center bg-white rounded-lg border border-dashed border-[#E7E1D3]">
                <p className="font-display text-base text-[#1C1B1A] mb-1">
                  {search ? "No matches on the high street" : "Nothing here yet"}
                </p>
                <p className="text-sm text-[#8A8578]">
                  {search
                    ? "Try a different name or cuisine."
                    : "Check back soon for new openings."}
                </p>
              </div>
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
    </div>
  );
}