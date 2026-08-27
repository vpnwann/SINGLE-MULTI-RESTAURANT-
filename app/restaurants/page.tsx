"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { restaurants } from "@/data/restaurants";
import RestaurantCard from "@/components/RestaurantCard";

const cuisines = ["All", ...Array.from(new Set(restaurants.map((r) => r.cuisine)))];
const ratingOptions = [0, 4, 4.3, 4.5];

function RestaurantsContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  const [search, setSearch] = useState(categoryFromUrl ?? "");
  const [cuisine, setCuisine] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [sortByRating, setSortByRating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = restaurants.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q);
      const matchesCuisine = cuisine === "All" || r.cuisine === cuisine;
      const matchesRating = r.rating >= minRating;
      return matchesSearch && matchesCuisine && matchesRating;
    });

    if (sortByRating) {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [search, cuisine, minRating, sortByRating]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">All Restaurants</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restaurants or cuisines..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
        />
        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {ratingOptions.map((r) => (
            <option key={r} value={r}>
              {r === 0 ? "All ratings" : `${r}+ stars`}
            </option>
          ))}
        </select>
        <button
          onClick={() => setSortByRating((s) => !s)}
          className={`text-sm px-3 py-2 rounded-lg border ${
            sortByRating
              ? "bg-orange-600 text-white border-orange-600"
              : "border-gray-300"
          }`}
        >
          Sort by rating
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No restaurants match your filters. Try clearing them.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>}>
      <RestaurantsContent />
    </Suspense>
  );
}
