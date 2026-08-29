export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceForTwo: number;
  image: string;
  description: string;
}

export interface FoodItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  subcategory: string;
  isVeg: boolean;
  rating: number;
  available: boolean;
}

export interface Coupon {
  code: string;
  type: "flat" | "percentage" | "freedel";
  value: number;
  maxDiscount?: number;
  description: string;
}