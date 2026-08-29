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

// ADD THESE

export interface CartItem extends FoodItem {
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

export interface Category {
  id: number;
  name: string;
  image?: string;
}

export interface OrderItem {
  id?: number;
  foodId?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: number;
  userId?: number;
  restaurantId?: number;
  restaurantName?: string;

  items: OrderItem[];

  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;

  status?: string;
  paymentStatus?: string;
  paymentId?: string;

  address?: string;

  createdAt?: string;
  updatedAt?: string;
}