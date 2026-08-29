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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Title */}
      <h1 className="text-2xl font-bold mb-4">
        All Restaurants
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">

        {/* Search */}
        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search restaurants or cuisines..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-orange-500"
        />

        {/* Cuisine */}
        <select
          value={cuisine}
          onChange={(e) =>
            setCuisine(e.target.value)
          }
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
          className={`text-sm px-3 py-2 rounded-lg border ${
            sortByRating
              ? "bg-orange-600 text-white border-orange-600"
              : "border-gray-300"
          }`}
        >
          Sort by rating
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-10 text-center text-gray-500">
          Loading restaurants...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="py-10 text-center">
          <p className="text-red-500 text-sm">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* No results */}
      {!loading &&
        !error &&
        filtered.length === 0 && (
          <p className="text-gray-500 text-sm">
            No restaurants match your
            filters. Try clearing them.
          </p>
        )}

      {/* Results */}
      {!loading &&
        !error &&
        filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
              />
            ))}
          </div>
        )}
    </div>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-8">
          Loading...
        </div>
      }
    >
      <RestaurantsContent />
    </Suspense>
  );
}