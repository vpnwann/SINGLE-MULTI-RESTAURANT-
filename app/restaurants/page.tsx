"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import RestaurantCard from "@/components/RestaurantCard";

type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  rating: number | string;
  delivery_time?: string;
  deliveryTime?: string;
  description?: string;
  image?: string;
};

const fontStyles = (
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
);

function RestaurantsContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  const [restaurants, setRestaurants] = useState<
    Restaurant[]
  >([]);

  const [search, setSearch] = useState(
    categoryFromUrl ?? ""
  );

  const [cuisine, setCuisine] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [sortByRating, setSortByRating] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Fetch restaurants from Express
   */
  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setLoading(true);
        setError("");

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:5000";

        const response = await fetch(
          `${API_URL}/api/restaurants`
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "Restaurants API:",
          result
        );

        if (!result.success) {
          throw new Error(
            "API returned success: false"
          );
        }

        const data = Array.isArray(result.data)
          ? result.data
          : [];

        /*
         * Convert backend fields to frontend fields
         */
        const formattedRestaurants =
          data.map((restaurant: any) => ({
            id: restaurant.id,

            name: restaurant.name,

            cuisine:
              restaurant.cuisine || "",

            rating:
              Number(restaurant.rating) || 0,

            delivery_time:
              restaurant.delivery_time ||
              "",

            deliveryTime:
              restaurant.delivery_time ||
              restaurant.deliveryTime ||
              "",

            description:
              restaurant.description ||
              "",

            image:
              restaurant.image || "",
          }));

        setRestaurants(
          formattedRestaurants
        );
      } catch (err) {
        console.error(
          "Restaurant API error:",
          err
        );

        setError(
          "Unable to load restaurants."
        );

        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurants();
  }, []);

  /*
   * Create cuisine list from REAL API data
   */
  const cuisines = useMemo(() => {
    const uniqueCuisines = Array.from(
      new Set(
        restaurants
          .map((restaurant) => restaurant.cuisine)
          .filter(Boolean)
      )
    );

    return ["All", ...uniqueCuisines];
  }, [restaurants]);

  /*
   * Filtering
   */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = restaurants.filter(
      (restaurant) => {
        const name =
          restaurant.name
            ?.toLowerCase() || "";

        const restaurantCuisine =
          restaurant.cuisine
            ?.toLowerCase() || "";

        const matchesSearch =
          !q ||
          name.includes(q) ||
          restaurantCuisine.includes(q);

        const matchesCuisine =
          cuisine === "All" ||
          restaurant.cuisine === cuisine;

        const matchesRating =
          Number(restaurant.rating) >=
          minRating;

        return (
          matchesSearch &&
          matchesCuisine &&
          matchesRating
        );
      }
    );

    /*
     * Sort highest rating first
     */
    if (sortByRating) {
      list = [...list].sort(
        (a, b) =>
          Number(b.rating) -
          Number(a.rating)
      );
    }

    return list;
  }, [
    restaurants,
    search,
    cuisine,
    minRating,
    sortByRating,
  ]);

  const activeFilterCount =
    (cuisine !== "All" ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (sortByRating ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body">
      {fontStyles}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Title */}
        <div className="mb-6">
        
          <h1 className="font-display text-3xl font-semibold text-[#1C1B1A]">
           SavourHighStreet
          </h1>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#E7E1D3] rounded-lg p-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-2.5">

            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8578]"
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
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search restaurants or cuisines"
                className="w-full border border-[#E7E1D3] rounded-md pl-10 pr-4 py-2 text-sm text-[#1C1B1A] outline-none focus:border-[#B8481E] transition-colors"
              />
            </div>

            {/* Cuisine */}
            <select
              value={cuisine}
              onChange={(e) =>
                setCuisine(e.target.value)
              }
              className="border border-[#E7E1D3] rounded-md px-3 py-2 text-sm text-[#1C1B1A] outline-none focus:border-[#B8481E] transition-colors bg-white"
            >
              {cuisines.map((c) => (
                <option
                  key={c}
                  value={c}
                >
                  {c}
                </option>
              ))}
            </select>

            {/* Rating */}
            <select
              value={minRating}
              onChange={(e) =>
                setMinRating(
                  Number(e.target.value)
                )
              }
              className="border border-[#E7E1D3] rounded-md px-3 py-2 text-sm text-[#1C1B1A] outline-none focus:border-[#B8481E] transition-colors bg-white"
            >
              <option value={0}>
                All ratings
              </option>

              <option value={4}>
                4+ stars
              </option>

              <option value={4.3}>
                4.3+ stars
              </option>

              <option value={4.5}>
                4.5+ stars
              </option>
            </select>

            {/* Sort */}
            <button
              onClick={() =>
                setSortByRating(
                  (current) => !current
                )
              }
              className={`text-sm px-4 py-2 rounded-md border font-medium transition-colors whitespace-nowrap ${
                sortByRating
                  ? "bg-[#B8481E] text-white border-[#B8481E]"
                  : "border-[#E7E1D3] text-[#1C1B1A] hover:border-[#B8481E]"
              }`}
            >
              Sort by rating
            </button>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[#EFEAE0]">
              <span className="font-data text-xs text-[#8A8578]">
                {activeFilterCount}{" "}
                {activeFilterCount === 1
                  ? "filter"
                  : "filters"}{" "}
                active
              </span>
              <button
                onClick={() => {
                  setCuisine("All");
                  setMinRating(0);
                  setSortByRating(false);
                }}
                className="text-xs text-[#B8481E] hover:text-[#8f3717] font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
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
            <p className="text-sm text-[#8A8578] mb-4">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="px-5 py-2.5 bg-[#B8481E] text-white rounded-md text-sm font-medium hover:bg-[#8f3717] transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* No results */}
        {!loading &&
          !error &&
          filtered.length === 0 && (
            <div className="py-10 text-center bg-white rounded-lg border border-dashed border-[#E7E1D3]">
              <p className="font-display text-base text-[#1C1B1A] mb-1">
                No matches
              </p>
              <p className="text-sm text-[#8A8578]">
                No restaurants match your filters. Try clearing them.
              </p>
            </div>
          )}

        {/* Results */}
        {!loading &&
          !error &&
          filtered.length > 0 && (
            <>
              <p className="font-data text-xs text-[#8A8578] mb-3">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "result"
                  : "results"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                  />
                ))}
              </div>
            </>
          )}
      </div>
    </div>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F1E7]">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="h-8 w-48 bg-[#EDE7D9] rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-lg bg-white border border-[#E7E1D3] animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <RestaurantsContent />
    </Suspense>
  );
}