import { Order } from "@/types";

const CART_KEY = "food-app-cart";
const ORDERS_KEY = "food-app-orders";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadCart<T>(): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveCart<T>(data: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors (e.g. quota exceeded)
  }
}

export function loadOrders(): Order[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore storage errors
  }
}

export function addOrder(order: Order): void {
  const orders = loadOrders();
  orders.unshift(order);
  saveOrders(orders);
}

export function getOrderById(id: string): Order | undefined {
  return loadOrders().find((o) => o.id === id);
}

export function updateOrderStatus(id: string, status: Order["orderStatus"]): Order | undefined {
  const orders = loadOrders();
  const order = orders.find((o) => o.id === id);
  if (order) {
    order.orderStatus = status;
    saveOrders(orders);
  }
  return order;
}
