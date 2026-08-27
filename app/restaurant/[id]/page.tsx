"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { getRestaurantById } from "@/data/restaurants";
import { getFoodByRestaurant } from "@/data/food";
import FoodCard from "@/components/FoodCard";

export default function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const restaurant = getRestaurantById(id);
  const allFood = useMemo(() => getFoodByRestaurant(id), [id]);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  const restaurantCategories = useMemo(() => {
    return Array.from(new Set(allFood.map((f) => f.category)));
  }, [allFood]);

  const restaurantSubcategories = useMemo(() => {
    if (!activeCategory) return [];
    return Array.from(
      new Set(
        allFood
          .filter((f) => f.category === activeCategory)
          .map((f) => f.subcategory)
      )
    );
  }, [allFood, activeCategory]);

  const filteredFood = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allFood.filter((f) => {
      const matchesSearch = !q || f.name.toLowerCase().includes(q);
      const matchesCategory = !activeCategory || f.category === activeCategory;
      const matchesSubcategory =
        !activeSubcategory || f.subcategory === activeSubcategory;
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [allFood, search, activeCategory, activeSubcategory]);

  if (!restaurant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-semibold mb-2">Restaurant not found</h1>
        <p className="text-gray-500 mb-4">
          We couldn&apos;t find the restaurant you&apos;re looking for.
        </p>
        <Link href="/restaurants" className="text-orange-600 hover:underline">
          Browse all restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        <p className="text-gray-600 text-sm mt-1">{restaurant.description}</p>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="bg-green-600 text-white px-1.5 py-0.5 rounded">
            ★ {restaurant.rating}
          </span>
          <span className="text-gray-500">{restaurant.cuisine}</span>
          <span className="text-gray-500">{restaurant.deliveryTime}</span>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search food in ${restaurant.name}...`}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
      />

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
        {restaurantCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setActiveSubcategory(null);
            }}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm border ${
              activeCategory === cat
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white border-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {restaurantSubcategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          <button
            onClick={() => setActiveSubcategory(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs border ${
              !activeSubcategory
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-200"
            }`}
          >
            All {activeCategory}
          </button>
          {restaurantSubcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubcategory(sub)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs border ${
                activeSubcategory === sub
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white border-gray-200"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filteredFood.length === 0 ? (
          <p className="text-gray-500 text-sm">No dishes match your filters.</p>
        ) : (
          filteredFood.map((food) => (
            <FoodCard key={food.id} food={food} restaurantName={restaurant.name} />
          ))
        )}
      </div>
    </div>
  );
}
