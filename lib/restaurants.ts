// lib/api/restaurants.ts
import { Restaurant, FoodItem } from "@/types";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${API_BASE}/restaurants`);
  if (!res.ok) throw new Error("Failed to fetch restaurants");
  return res.json();
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const res = await fetch(`${API_BASE}/restaurants/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch restaurant");
  return res.json();
}

export async function getRestaurantFood(id: string): Promise<FoodItem[]> {
  const res = await fetch(`${API_BASE}/restaurants/${id}/food`);
  if (!res.ok) throw new Error("Failed to fetch food items");
  return res.json();
}