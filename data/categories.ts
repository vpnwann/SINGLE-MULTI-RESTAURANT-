import { Category } from "@/types";

export const categories: Category[] = [
  {
    name: "Biryani",
    subcategories: ["Chicken Biryani", "Mutton Biryani", "Veg Biryani"],
  },
  {
    name: "Pizza",
    subcategories: ["Veg Pizza", "Chicken Pizza", "Cheese Pizza"],
  },
  {
    name: "Burgers",
    subcategories: ["Veg Burgers", "Chicken Burgers"],
  },
  {
    name: "North Indian",
    subcategories: ["Curries", "Breads", "Rice"],
  },
  {
    name: "Starters",
    subcategories: ["Veg Starters", "Non-Veg Starters"],
  },
  {
    name: "Healthy",
    subcategories: ["Salads", "Bowls", "Smoothies"],
  },
  {
    name: "Desserts",
    subcategories: ["Cakes", "Ice Cream", "Indian Sweets"],
  },
  {
    name: "Beverages",
    subcategories: ["Cold Drinks", "Shakes", "Juices"],
  },
];

export function getCategoryNames(): string[] {
  return categories.map((c) => c.name);
}

export function getSubcategories(categoryName: string): string[] {
  return categories.find((c) => c.name === categoryName)?.subcategories ?? [];
}
