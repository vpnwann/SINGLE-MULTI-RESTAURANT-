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

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">
          Loading restaurant...
        </p>
      </div>
    );
  }

  /*
   * Error / restaurant not found
   */
  if (error || !restaurant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-semibold mb-2">
          Restaurant not found
        </h1>

        <p className="text-gray-500 mb-4">
          {error ||
            "We couldn't find the restaurant you're looking for."}
        </p>

        <Link
          href="/restaurants"
          className="text-orange-600 hover:underline"
        >
          Browse all restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Restaurant Header */}
      <div className="mb-5">

        {restaurant.image && (
          <img
            src={getImageUrl(
              restaurant.image
            )}
            alt={restaurant.name}
            className="w-full h-56 object-cover rounded-xl mb-4"
          />
        )}

        <h1 className="text-2xl font-bold">
          {restaurant.name}
        </h1>

        <p className="text-gray-600 text-sm mt-1">
          {restaurant.description}
        </p>

        <div className="flex items-center gap-3 mt-2 text-sm">

          <span className="bg-green-600 text-white px-1.5 py-0.5 rounded">
            ★ {restaurant.rating}
          </span>

          <span className="text-gray-500">
            {restaurant.cuisine}
          </span>

          <span className="text-gray-500">
            {restaurant.deliveryTime}
          </span>

        </div>
      </div>

      {/* Food Search */}
      <input
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder={`Search food in ${restaurant.name}...`}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 outline-none focus:border-orange-500"
      />

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2">

        <button
          onClick={() => {
            setActiveCategory(null);
            setActiveSubcategory(null);
          }}
          className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm border ${
            !activeCategory
              ? "bg-orange-600 text-white border-orange-600"
              : "bg-white border-gray-200"
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
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm border ${
                activeCategory ===
                category
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-white border-gray-200"
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
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs border ${
              !activeSubcategory
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-200"
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
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs border ${
                  activeSubcategory ===
                  subcategory
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white border-gray-200"
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
          <p className="text-gray-500 text-sm">
            No dishes match your filters.
          </p>
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
  );
}