# TastyGo — Food Delivery Frontend (Next.js)

A fully working, frontend-only food delivery demo built with Next.js App
Router, TypeScript, Tailwind CSS, and local mock data. No backend or
database — cart and order data persist to `localStorage`.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To build for production:

```bash
npm run build
npm run start
```

## Environment variables

`.env.local` already includes a placeholder Razorpay test key:

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890
```

Replace it with your own Razorpay **test** key if you want the real
Razorpay Checkout modal to open. If the Razorpay script can't be loaded
(no key, no network, blocked, etc.), the app automatically falls back to a
mock payment button so the checkout flow always completes.

**Never** put `RAZORPAY_KEY_SECRET` in this project — it's frontend-only.
`lib/razorpay.ts` has stub functions (`createOrderOnServer`,
`verifyPaymentOnServer`) showing exactly where a future Express.js backend
would create/verify real Razorpay orders.

## What's included

- 5 restaurants, 50 food items (10 each), shared categories/subcategories
- Restaurant search, cuisine filter, rating filter, sort by rating
- Restaurant detail page with category/subcategory filtering + search
- Cart via React Context, persisted to localStorage, with full price
  breakdown (item total, delivery fee, platform fee, GST, discount, grand
  total)
- 3 working coupons: `WELCOME50`, `FOOD20`, `FREEDEL`
- Checkout with editable address, Razorpay or Cash on Delivery
- Order creation, order success page, order history, and order tracking
  with a "Next Status" button that steps through:
  Order Confirmed → Restaurant Accepted → Preparing → Out for Delivery →
  Delivered
- Handles edge cases: invalid restaurant ID, invalid order ID, empty cart,
  empty order history, invalid coupon, payment failure/cancellation

## Project structure

```
app/            routes (home, restaurants, restaurant/[id], cart, checkout,
                order-success, orders, orders/[id])
components/     Navbar, RestaurantCard, FoodCard, CartItem, CartSummary,
                RazorpayCheckout
context/        CartContext (React Context + localStorage persistence)
data/           restaurants, food, categories, coupons (mock data)
lib/            storage.ts, calculations.ts, razorpay.ts
types/          shared TypeScript interfaces
```
