export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceForTwo: number;
  image: string;
  description: string;
}

export interface FoodItem {
  id: string;
  restaurantId: string;
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

export interface Category {
  name: string;
  subcategories: string[];
}

export interface Coupon {
  code: string;
  type: "flat" | "percentage" | "freedel";
  value: number;
  maxDiscount?: number;
  description: string;
}

export interface CartItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  image: string;
  isVeg: boolean;
  quantity: number;
}

export interface CartTotals {
  itemTotal: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  discount: number;
  grandTotal: number;
}

export type OrderStatus =
  | "Order Confirmed"
  | "Restaurant Accepted"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered";

export type PaymentStatus = "Paid" | "Pending" | "Failed";

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  discount: number;
  couponCode: string | null;
  total: number;
  address: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
}

export interface Address {
  name: string;
  line: string;
  pincode: string;
}
