import { Restaurant } from "@/types";

export const restaurants: Restaurant[] = [
  {
    id: "spice-garden",
    name: "Spice Garden",
    cuisine: "North Indian",
    rating: 4.3,
    deliveryTime: "30-35 mins",
    priceForTwo: 500,
    image: "https://placehold.co/400x250/f97316/ffffff?text=Spice+Garden",
    description: "Authentic North Indian curries, breads and rich gravies.",
  },
  {
    id: "pizza-hub",
    name: "Pizza Hub",
    cuisine: "Italian, Pizza",
    rating: 4.1,
    deliveryTime: "25-30 mins",
    priceForTwo: 450,
    image: "https://placehold.co/400x250/dc2626/ffffff?text=Pizza+Hub",
    description: "Wood-fired pizzas and Italian classics made fresh daily.",
  },
  {
    id: "burger-street",
    name: "Burger Street",
    cuisine: "Burgers, Fast Food",
    rating: 4.0,
    deliveryTime: "20-25 mins",
    priceForTwo: 350,
    image: "https://placehold.co/400x250/eab308/ffffff?text=Burger+Street",
    description: "Juicy burgers, crispy fries and fast food favorites.",
  },
  {
    id: "biryani-house",
    name: "Biryani House",
    cuisine: "Biryani, Mughlai",
    rating: 4.5,
    deliveryTime: "35-40 mins",
    priceForTwo: 550,
    image: "https://placehold.co/400x250/16a34a/ffffff?text=Biryani+House",
    description: "Slow-cooked dum biryanis and royal Mughlai dishes.",
  },
  {
    id: "healthy-bowl",
    name: "Healthy Bowl",
    cuisine: "Healthy, Continental",
    rating: 4.2,
    deliveryTime: "20-25 mins",
    priceForTwo: 400,
    image: "https://placehold.co/400x250/0ea5e9/ffffff?text=Healthy+Bowl",
    description: "Fresh salads, protein bowls and continental light meals.",
  },
];

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find((r) => r.id === id);
}
