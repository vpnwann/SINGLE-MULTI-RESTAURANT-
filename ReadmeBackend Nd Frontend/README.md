# TastyGo — Food Delivery Frontend

A complete, working food delivery web app built with **Next.js App
Router, TypeScript, Tailwind CSS, and React**. It ships with local mock
data (5 restaurants, 50 dishes), a real cart/checkout/order flow, coupon
codes, and a Razorpay payment integration point — all running **without
any backend or database**. Cart and order state persist in the browser
via `localStorage`.

This README covers the frontend you have in hand. A separate
[`BACKEND_README.md`](./BACKEND_README.md) describes the Express.js
backend you'd build to turn this into a production app (real payments,
real order storage, auth, etc.).

---

## 1. Quick start

```bash
npm install
npm run dev
```

Visit **http://localhost:3000**.

Production build:

```bash
npm run build
npm run start
```

Type-check and lint:

```bash
npx tsc --noEmit
npx eslint .
```

Both currently pass with zero errors.

---

## 2. Environment variables

Create/edit `.env.local` in the project root:

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

- This is your Razorpay **test key ID** — safe to expose on the client
  (that's what `NEXT_PUBLIC_` means in Next.js).
- **Never** put `RAZORPAY_KEY_SECRET` in this project or in any
  `NEXT_PUBLIC_*` variable. The secret must only ever live on a backend
  server. See `BACKEND_README.md` for where it belongs.
- If the key is missing, invalid, or the Razorpay script can't load (no
  network, ad blocker, etc.), the app **automatically falls back to a
  mock payment button** so the checkout flow always completes end-to-end
  for demo purposes.

---

## 3. Tech stack

| Layer          | Choice                                   |
|----------------|-------------------------------------------|
| Framework      | Next.js 16 (App Router, Turbopack)       |
| Language       | TypeScript (strict mode)                 |
| Styling        | Tailwind CSS v4                          |
| State          | React Context (`CartContext`)            |
| Persistence    | `localStorage` (cart + orders)           |
| Data           | Local mock data (`data/*.ts`)            |
| Payments       | Razorpay Checkout (frontend-only, mock fallback) |

No external UI library, no state management library, no database driver —
intentionally minimal so the whole thing runs standalone.

---

## 4. Project structure

```
app/
  page.tsx                  Homepage — search, categories, restaurant list
  restaurants/page.tsx      All restaurants — search, cuisine/rating filter, sort
  restaurant/[id]/page.tsx  Restaurant menu — category/subcategory filter, search, add to cart
  cart/page.tsx             Cart — items, quantities, coupon, price summary
  checkout/page.tsx         Checkout — address, payment method, place order
  order-success/page.tsx    Post-order confirmation screen
  orders/page.tsx           Order history list
  orders/[id]/page.tsx      Order detail + live status tracker
  layout.tsx                Root layout — wraps app in CartProvider + Navbar
  globals.css               Tailwind entry point

components/
  Navbar.tsx                Top nav with live cart item count
  RestaurantCard.tsx        Restaurant preview card (used on home + listing)
  FoodCard.tsx              Menu item card with add/quantity controls
  CartItem.tsx              Cart line item with quantity controls
  CartSummary.tsx           Price breakdown + coupon input
  RazorpayCheckout.tsx      Razorpay Checkout button + mock-payment fallback

context/
  CartContext.tsx           Cart state, persistence, coupon logic, totals

data/
  restaurants.ts            5 restaurants
  food.ts                   50 food items (10 per restaurant)
  categories.ts             Shared category → subcategory tree
  coupons.ts                WELCOME50 / FOOD20 / FREEDEL definitions

lib/
  storage.ts                localStorage read/write helpers (cart + orders)
  calculations.ts           Cart math: item total, fees, GST, discount, grand total
  razorpay.ts                Script loader + documented backend integration stubs

types/
  index.ts                  Shared TypeScript interfaces (Restaurant, FoodItem, Order, etc.)
```

---

## 5. Feature walkthrough

### Homepage (`/`)
App name, a search box (filters restaurants by name/cuisine live), a
horizontally scrollable category strip (links into `/restaurants` with a
pre-filled search term), and the restaurant list.

### Restaurants (`/restaurants`)
- Free-text search (name or cuisine)
- Cuisine dropdown filter
- Minimum-rating dropdown filter
- "Sort by rating" toggle
- Empty state when filters match nothing

### Restaurant detail (`/restaurant/[id]`)
- Dynamic route — one page template renders all 5 restaurants
- Restaurant header (name, cuisine, rating, delivery time, description)
- Category pills → subcategory pills (subcategories only shown once a
  category is picked, and only the subcategories that restaurant actually
  has)
- Food search within the restaurant
- Add-to-cart / quantity stepper directly on each `FoodCard`
- Invalid restaurant ID shows a friendly "not found" screen with a link
  back to `/restaurants`

### Cart (`/cart`)
- Powered entirely by `CartContext`
- Quantity +/- and remove-item controls
- "Clear cart" action
- Full price breakdown via `CartSummary`
- Empty-cart state with a call-to-action back to `/restaurants`

### Cart logic (`context/CartContext.tsx`)
```ts
addToCart(food, restaurantName)
removeFromCart(itemId)
increaseQuantity(itemId)
decreaseQuantity(itemId)
clearCart()
applyCoupon(code)
removeCoupon()
getCartTotal()
getItemCount()
```
- Cart is **single-restaurant**: adding an item from a different
  restaurant than what's already in the cart replaces the cart (matches
  how most real delivery apps behave).
- Entire cart state (`items`, `couponCode`) is persisted to
  `localStorage` on every change, and rehydrated on load.

### Pricing (`lib/calculations.ts`)
```
Item Total    = Σ (price × quantity)
Delivery Fee  = ₹40 flat (₹0 if FREEDEL is applied)
Platform Fee  = ₹10 flat
Discount      = coupon-dependent (see below)
GST           = 5% of (Item Total − Discount)
Grand Total   = (Item Total − Discount) + Delivery Fee + Platform Fee + GST
```
All fees are 0 when the cart is empty.

### Coupons (`data/coupons.ts`)
| Code        | Effect                                   |
|-------------|-------------------------------------------|
| `WELCOME50` | Flat ₹50 off (capped at item total)       |
| `FOOD20`    | 20% off, capped at ₹100                   |
| `FREEDEL`   | Delivery fee waived                       |

Invalid codes show an inline error and never change the total. Coupons
are cleared automatically if the cart becomes empty.

### Checkout (`/checkout`)
- Pre-filled sample address (Namit, Jaipur, Rajasthan, 302001), editable
  in place
- Full order + price summary re-shown for confirmation
- Payment method: **Razorpay** or **Cash on Delivery**
- On success, an `Order` object is written to `localStorage`, the cart is
  cleared, and the user is redirected to `/order-success?orderId=...`
- Guards against checking out with an empty cart

### Razorpay integration (`components/RazorpayCheckout.tsx`, `lib/razorpay.ts`)
- Loads `https://checkout.razorpay.com/v1/checkout.js` on demand
- Opens the real Razorpay Checkout modal using
  `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- Handles success, failure, and modal-dismiss cases
- **Automatically falls back to a mock payment** (a short delay, then a
  synthetic `pay_mock_...` ID) if the script can't load or `window.Razorpay`
  isn't available — this is what lets the full order flow work in this
  frontend-only sandbox with no backend and no live Razorpay order
- `lib/razorpay.ts` also documents (as stub functions that intentionally
  throw) exactly what a backend-integrated version would call:
  `createOrderOnServer()` and `verifyPaymentOnServer()` — see
  `BACKEND_README.md`

### Order success (`/order-success`)
Shows order ID, restaurant, itemized list, total paid, address, and
payment status, with **View Order** and **Continue Shopping** actions.
Handles a missing/invalid `orderId` query param gracefully.

### Order history (`/orders`)
Lists all orders from `localStorage`, newest first, with a "no orders
yet" empty state.

### Order tracking (`/orders/[id]`)
- Shows the 5-step delivery pipeline:
  `Order Confirmed → Restaurant Accepted → Preparing → Out for Delivery → Delivered`
- **Next Status** button advances the order one step at a time and
  persists the new status to `localStorage`
- Invalid order ID shows a "not found" screen

---

## 6. Edge cases handled

| Case                          | Behavior                                             |
|--------------------------------|-------------------------------------------------------|
| Invalid restaurant ID          | Friendly "Restaurant not found" page + link back      |
| Invalid order ID               | Friendly "Order not found" page + link back           |
| Empty cart on `/cart`          | Empty-state screen, no crash                          |
| Empty cart on `/checkout`      | Redirected to an empty-state screen, can't check out  |
| Empty order history            | Empty-state screen with CTA                           |
| Invalid coupon code            | Inline error message, totals unaffected               |
| Coupon applied to empty cart   | Blocked with an inline error                          |
| Razorpay payment failure/cancel| Inline error shown, order is **not** created           |
| Razorpay script unavailable    | Silent fallback to mock payment, flow still completes |

---

## 7. Known limitations (by design — this is a frontend-only demo)

- No real database — all persistence is `localStorage`, so data is
  per-browser and clears if storage is cleared.
- No authentication/user accounts.
- No real Razorpay order is created or verified server-side (would
  require `RAZORPAY_KEY_SECRET`, which must never live in this repo).
- No real-time order status updates from a restaurant/delivery partner —
  status is advanced manually via the "Next Status" button.
- Images are placeholder URLs (`placehold.co`), not real food photography.

See `BACKEND_README.md` for exactly what to build to remove these
limitations.

---

## 8. Scripts reference

| Command            | Purpose                          |
|---------------------|-----------------------------------|
| `npm run dev`       | Start dev server (Turbopack)     |
| `npm run build`     | Production build                 |
| `npm run start`     | Serve the production build       |
| `npm run lint`      | Run ESLint                       |
