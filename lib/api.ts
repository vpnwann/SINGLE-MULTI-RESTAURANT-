import { Restaurant, FoodItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const data = await apiFetch<any>("/api/restaurants");

  return Array.isArray(data)
    ? data
    : data.restaurants ?? [];
}

export async function getRestaurant(
  id: string | number
): Promise<Restaurant> {
  const data = await apiFetch<any>(`/api/restaurants/${id}`);

  return data.restaurant ?? data;
}

export async function getRestaurantFood(
  id: string | number
): Promise<FoodItem[]> {
  const data = await apiFetch<any>(
    `/api/restaurants/${id}/food`
  );

  return Array.isArray(data)
    ? data
    : data.foodItems ?? data.food ?? [];
}

export async function getFood(
  id: string | number
): Promise<FoodItem> {
  const data = await apiFetch<any>(`/api/food/${id}`);

  return data.food ?? data;
}