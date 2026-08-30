"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FoodCard from "@/components/FoodCard";

type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  rating: number | string;
  deliveryTime: string;
  description: string;
  image?: string;
};

type FoodItem = {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number | string;
  image?: string;
  category: string;
  subcategory: string;
  isVeg: boolean;
  rating?: number | string;
  available: boolean;
};

export default function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [allFood, setAllFood] = useState<FoodItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] =
    useState<string | null>(null);

  /*
   * Backend:
   * http://localhost:5000
   */
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";

  /*
   * Convert backend image path into a usable browser URL.
   *
   * Backend gives:
   * /images/restaurants/spice-route.jpg
   *
   * Browser needs:
   * http://localhost:5000/images/restaurants/spice-route.jpg
   */
  const getImageUrl = (image?: string) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${API_URL}${image.startsWith("/") ? image : `/${image}`}`;
  };

  /*
   * Fetch restaurant + food
   */
  useEffect(() => {
    async function fetchRestaurantData() {
      try {
        setLoading(true);
        setError("");

        /*
         * Restaurant
         */
        const restaurantResponse = await fetch(
          `${API_URL}/api/restaurants/${id}`
        );

        if (!restaurantResponse.ok) {
          throw new Error(
            `Restaurant HTTP ${restaurantResponse.status}`
          );
        }

        const restaurantResult =
          await restaurantResponse.json();

        console.log(
          "Restaurant API:",
          restaurantResult
        );

        if (!restaurantResult.success) {
          throw new Error(
            "Restaurant API returned success: false"
          );
        }

        const restaurantData =
          restaurantResult.data;

        if (!restaurantData) {
          throw new Error(
            "Restaurant not found"
          );
        }

        /*
         * Convert backend fields
         *
         * delivery_time -> deliveryTime
         */
        setRestaurant({
          id: restaurantData.id,
          name: restaurantData.name,
          cuisine: restaurantData.cuisine,
          rating: restaurantData.rating,
          deliveryTime:
            restaurantData.delivery_time ||
            restaurantData.deliveryTime ||
            "",
          description:
            restaurantData.description || "",
          image: restaurantData.image,
        });

        /*
         * Food
         */
        const foodResponse = await fetch(
          `${API_URL}/api/restaurants/${id}/food`
        );

        if (!foodResponse.ok) {
          throw new Error(
            `Food HTTP ${foodResponse.status}`
          );
        }

        const foodResult =
          await foodResponse.json();

        console.log(
          "Food API:",
          foodResult
        );

        if (!foodResult.success) {
          throw new Error(
            "Food API returned success: false"
          );
        }

        const foodData = Array.isArray(
          foodResult.data
        )
          ? foodResult.data
          : [];

        /*
         * Convert backend food fields
         *
         * Supports both camelCase and snake_case.
         */
        const formattedFood: FoodItem[] =
          foodData.map((food: any) => ({
            id: food.id,
            restaurantId:
              food.restaurant_id ??
              food.restaurantId ??
              Number(id),

            name: food.name,

            description:
              food.description || "",

            price: food.price,

            image: food.image,

            category:
              food.category || "Other",

            subcategory:
              food.subcategory || "",

            isVeg:
              food.is_veg ??
              food.isVeg ??
              false,

            rating: food.rating,

            available:
              food.available ??
              true,
          }));

        setAllFood(formattedFood);
      } catch (err) {
        console.error(
          "Restaurant page error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load restaurant."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurantData();
  }, [id, API_URL]);

  /*
   * Categories
   */
  const restaurantCategories = useMemo(() => {
    return Array.from(
      new Set(
        allFood
          .map((food) => food.category)
          .filter(Boolean)
      )
    );
  }, [allFood]);

  /*
   * Subcategories
   */
  const restaurantSubcategories = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    return Array.from(
      new Set(
        allFood
          .filter(
            (food) =>
              food.category === activeCategory
          )
          .map((food) => food.subcategory)
          .filter(Boolean)
      )
    );
  }, [allFood, activeCategory]);

  /*
   * Search + category + subcategory filtering
   */
  const filteredFood = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    return allFood.filter((food) => {
      const matchesSearch =
        !q ||
        food.name
          ?.toLowerCase()
          .includes(q) ||
        food.description
          ?.toLowerCase()
          .includes(q);

      const matchesCategory =
        !activeCategory ||
        food.category === activeCategory;

      const matchesSubcategory =
        !activeSubcategory ||
        food.subcategory ===
          activeSubcategory;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory
      );
    });
  }, [
    allFood,
    search,
    activeCategory,
    activeSubcategory,
  ]);

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

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] font-body">
        {fontStyles}
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="w-full h-56 rounded-xl bg-[#EDE7D9] animate-pulse mb-4" />
          <div className="h-6 w-2/3 bg-[#EDE7D9] rounded animate-pulse mb-2" />
          <div className="h-3.5 w-1/2 bg-[#EDE7D9] rounded animate-pulse mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-white border border-[#E7E1D3] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /*
   * Error / restaurant not found
   */
  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] font-body">
        {fontStyles}
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold text-[#1C1B1A] mb-2">
            Restaurant not found
          </h1>

          <p className="text-[#8A8578] text-sm mb-5">
            {error ||
              "We couldn't find the restaurant you're looking for."}
          </p>

          <Link
            href="/restaurants"
            className="inline-block px-5 py-2.5 bg-[#B8481E] text-white rounded-md text-sm font-medium hover:bg-[#8f3717] transition-colors"
          >
            Browse all restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body">
      {fontStyles}

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Restaurant Header */}
        <div className="mb-6">

          {restaurant.image && (
            <img
              src={getImageUrl(
                restaurant.image
              )}
              alt={restaurant.name}
              className="w-full h-56 object-cover rounded-xl mb-4 border border-[#E7E1D3]"
            />
          )}

          <p className="text-[11px] uppercase tracking-[0.15em] text-[#8A8578] mb-1">
            {restaurant.cuisine}
          </p>

          <h1 className="font-display text-3xl font-semibold text-[#1C1B1A]">
            {restaurant.name}
          </h1>

          <p className="text-[#5B6660] text-sm mt-1.5 leading-relaxed">
            {restaurant.description}
          </p>

          <div className="flex items-center gap-3 mt-3 text-sm">

            <span className="font-data flex items-center gap-1 bg-[#1C1B1A] text-[#D8A312] px-2 py-1 rounded text-xs">
              ★ {restaurant.rating}
            </span>

            <span className="text-[#8A8578]">
              {restaurant.deliveryTime}
            </span>

          </div>
        </div>

        {/* Food Search */}
        <div className="relative mb-4">
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
            placeholder={`Search food in ${restaurant.name}`}
            className="w-full bg-white border border-[#E7E1D3] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#1C1B1A] outline-none focus:border-[#B8481E] transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2">

          <button
            onClick={() => {
              setActiveCategory(null);
              setActiveSubcategory(null);
            }}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm border transition-colors ${
              !activeCategory
                ? "bg-[#B8481E] text-white border-[#B8481E]"
                : "bg-white border-[#E7E1D3] text-[#1C1B1A] hover:border-[#B8481E]"
            }`}
          >
            All
          </button>

          {restaurantCategories.map(
            (category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(
                    category
                  );
                  setActiveSubcategory(
                    null
                  );
                }}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm border transition-colors ${
                  activeCategory ===
                  category
                    ? "bg-[#B8481E] text-white border-[#B8481E]"
                    : "bg-white border-[#E7E1D3] text-[#1C1B1A] hover:border-[#B8481E]"
                }`}
              >
                {category}
              </button>
            )
          )}

        </div>

        {/* Subcategories */}
        {restaurantSubcategories.length >
          0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4">

            <button
              onClick={() =>
                setActiveSubcategory(null)
              }
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs border transition-colors ${
                !activeSubcategory
                  ? "bg-[#1C1B1A] text-white border-[#1C1B1A]"
                  : "bg-white border-[#E7E1D3] text-[#5B6660] hover:border-[#1C1B1A]"
              }`}
            >
              All {activeCategory}
            </button>

            {restaurantSubcategories.map(
              (subcategory) => (
                <button
                  key={subcategory}
                  onClick={() =>
                    setActiveSubcategory(
                      subcategory
                    )
                  }
                  className={`flex-shrink-0 rounded-full px-3 py-1 text-xs border transition-colors ${
                    activeSubcategory ===
                    subcategory
                      ? "bg-[#1C1B1A] text-white border-[#1C1B1A]"
                      : "bg-white border-[#E7E1D3] text-[#5B6660] hover:border-[#1C1B1A]"
                  }`}
                >
                  {subcategory}
                </button>
              )
            )}

          </div>
        )}

        {/* Food */}
        <div className="space-y-3">

          {filteredFood.length === 0 ? (
            <div className="py-10 text-center bg-white rounded-lg border border-dashed border-[#E7E1D3]">
              <p className="font-display text-base text-[#1C1B1A] mb-1">
                No dishes match
              </p>
              <p className="text-sm text-[#8A8578]">
                Try a different search term or filter.
              </p>
            </div>
          ) : (
            filteredFood.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                restaurantName={
                  restaurant.name
                }
              />
            ))
          )}

        </div>
      </div>
    </div>
  );
}