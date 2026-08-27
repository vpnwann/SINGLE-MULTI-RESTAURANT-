# TastyGo — Backend Blueprint (Express.js)

The current app in this repo is **frontend-only** — there is no backend
here today. This document is a blueprint for the Express.js backend you
would build to turn TastyGo into a production system, written so it maps
directly onto the frontend's existing code (same field names, same
flows, same integration points already stubbed out in `lib/razorpay.ts`).

Nothing in this file needs to exist for the frontend to run in demo mode.
Build it only when you're ready to go from "local mock data + localStorage"
to "real database + real payments."

---

## 1. Why you need a backend at all

Three things in the current frontend are explicitly marked as demo-only
because they require a server to do safely or correctly:

1. **Creating a real Razorpay order.** Razorpay requires signing the order
   creation request with your **Key Secret**, which must never be shipped
   to a browser. Right now `lib/razorpay.ts` has a stub,
   `createOrderOnServer()`, that always throws — the frontend falls back
   to a mock/test payment instead.
2. **Verifying a payment.** After Razorpay's checkout succeeds, the
   payment signature must be verified server-side (HMAC SHA256 with the
   Key Secret) before you trust that the payment actually happened.
   `verifyPaymentOnServer()` is stubbed the same way.
3. **Durable, shared order storage.** `localStorage` is per-browser and
   easy to lose. A real app needs orders stored centrally so a user can
   see their history from any device, and so a restaurant/delivery
   partner can update status.

Everything else (restaurant list, menu, cart math, coupons) can stay as
static/local data for a while longer, or move to the backend at your own
pace.

---

## 2. Suggested stack

| Concern           | Suggestion                                  |
|--------------------|-----------------------------------------------|
| Server             | Node.js + Express.js                        |
| Language           | TypeScript (share types with the frontend!) |
| Database           | PostgreSQL (or MongoDB if you prefer NoSQL) |
| ORM/driver         | Prisma (Postgres) or Mongoose (MongoDB)     |
| Auth               | JWT in an httpOnly cookie, or NextAuth if you move auth into Next.js |
| Payments           | `razorpay` npm package (server-side only)   |
| Validation         | `zod` (matches the TS types you already have) |

You can literally copy `types/index.ts` from the frontend into a shared
package (or just duplicate it) so request/response shapes stay in sync.

---

## 3. Environment variables (backend only — never in the frontend)

```bash
# .env on the backend server — NEVER commit, NEVER expose to the client
DATABASE_URL=postgres://user:password@host:5432/tastygo
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx        # same public key the frontend uses
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx # SECRET — server-side only, ever
JWT_SECRET=some-long-random-string
PORT=4000
CORS_ORIGIN=https://your-frontend-domain.com
```

The frontend keeps using `NEXT_PUBLIC_RAZORPAY_KEY_ID` (the public key
only) — that does not change.

---

## 4. Suggested project structure

```
backend/
  src/
    index.ts                 Express app entrypoint
    config/
      env.ts                 Loads & validates env vars
      db.ts                  Database connection
    middleware/
      auth.ts                JWT auth middleware
      errorHandler.ts        Centralized error handling
    routes/
      restaurants.routes.ts
      food.routes.ts
      orders.routes.ts
      coupons.routes.ts
      razorpay.routes.ts
      auth.routes.ts
    controllers/
      restaurants.controller.ts
      food.controller.ts
      orders.controller.ts
      coupons.controller.ts
      razorpay.controller.ts
      auth.controller.ts
    services/
      razorpay.service.ts     Wraps the `razorpay` npm package
      order.service.ts        Order creation/status transition logic
    models/                   Prisma schema or Mongoose models
    types/
      index.ts                 Mirrors the frontend's types/index.ts
  prisma/
    schema.prisma
  package.json
  tsconfig.json
```

---

## 5. Data model

Mirrors the frontend's `types/index.ts` almost field-for-field, so moving
from mock data to real data is mostly a matter of pointing the same
shapes at API calls instead of `data/*.ts` imports.

```
Restaurant
  id, name, cuisine, rating, deliveryTime, priceForTwo, image, description

FoodItem
  id, restaurantId (FK), name, description, price, image,
  category, subcategory, isVeg, rating, available

Coupon
  code, type ("flat" | "percentage" | "freedel"), value, maxDiscount, description

User                      (new — not in the frontend today)
  id, name, email, passwordHash, createdAt

Address                   (new — currently just local state on /checkout)
  id, userId (FK), name, line, pincode, isDefault

Order
  id, userId (FK), restaurantId (FK), restaurantName,
  items (JSON or a separate OrderItem table),
  subtotal, deliveryFee, platformFee, tax, discount, couponCode,
  total, address, paymentMethod, paymentStatus, orderStatus,
  razorpayOrderId, razorpayPaymentId,
  createdAt, updatedAt

OrderItem                 (if normalizing instead of storing items as JSON)
  id, orderId (FK), foodItemId (FK), name, price, quantity, isVeg, image
```

`orderStatus` and `paymentStatus` should be Postgres enums (or string
enums in Mongoose) matching the frontend's `OrderStatus` /
`PaymentStatus` unions exactly:

```ts
type OrderStatus =
  | "Order Confirmed"
  | "Restaurant Accepted"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered";

type PaymentStatus = "Paid" | "Pending" | "Failed";
```

---

## 6. API surface

All endpoints below are `/api/...` and return JSON. Replace the
frontend's direct imports from `data/*.ts` with `fetch` calls to these
once you're ready.

### Restaurants & food
```
GET  /api/restaurants                 List all restaurants
GET  /api/restaurants/:id             Get one restaurant (404 if missing)
GET  /api/restaurants/:id/food        Get all food items for a restaurant
GET  /api/food/:id                    Get one food item
```

### Coupons
```
GET  /api/coupons/:code               Validate a coupon code
                                       -> 404 if invalid, else coupon details
```
Keep the discount **calculation** (`lib/calculations.ts`) logic on the
backend too, so the client never has to be trusted to compute its own
total. The frontend can still show a live preview, but the backend
should recompute and enforce the final total at order-creation time.

### Orders
```
POST   /api/orders                    Create an order (see flow below)
GET    /api/orders                    List orders for the authenticated user
GET    /api/orders/:id                Get one order (404 if missing / not owned)
PATCH  /api/orders/:id/status         Advance order status (restaurant/admin only)
```

### Auth (new — the current frontend has no login)
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Razorpay
```
POST   /api/razorpay/create-order     Create a real Razorpay order (server-side)
POST   /api/razorpay/verify-payment   Verify payment signature after checkout
```

---

## 7. The real payment flow (replacing the mock)

This is the sequence that plugs directly into
`components/RazorpayCheckout.tsx` and `lib/razorpay.ts` on the frontend.

**Frontend → Backend → Razorpay → Backend → Frontend**

1. User clicks "Pay ₹X" on `/checkout`.
2. Frontend calls `POST /api/razorpay/create-order` with
   `{ amountInRupees, receipt: cartId }`.
3. Backend calls Razorpay's Orders API using `RAZORPAY_KEY_SECRET`,
   receives a real `order_id`, and returns
   `{ orderId, amount, currency }` to the frontend.
   This is exactly what `createOrderOnServer()` in `lib/razorpay.ts` is
   stubbed to do — implement it for real and have it call your backend.
4. Frontend passes that `order_id` into the Razorpay Checkout options
   (currently `RazorpayCheckout.tsx` doesn't set `order_id` because there
   is no real order to reference — that's the one line to add).
5. User completes payment in the Razorpay modal.
6. Razorpay's `handler` callback fires with
   `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`.
7. Frontend calls `POST /api/razorpay/verify-payment` with those three
   values. This is what `verifyPaymentOnServer()` is stubbed for.
8. Backend recomputes the HMAC SHA256 signature using
   `RAZORPAY_KEY_SECRET` and compares it to `razorpay_signature`. Only if
   it matches does the backend mark the payment as verified.
9. Only after verification does the backend call `POST /api/orders` to
   actually create the order record (or the frontend calls it, but the
   backend re-validates payment status before persisting
   `paymentStatus: "Paid"`).
10. Backend returns the created order; frontend redirects to
    `/order-success?orderId=...` exactly as it does today — no frontend
    routing changes needed.

```ts
// services/razorpay.service.ts (backend)
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRazorpayOrder(amountInRupees: number, receipt: string) {
  return razorpay.orders.create({
    amount: Math.round(amountInRupees * 100), // paise
    currency: "INR",
    receipt,
  });
}

export function verifySignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
```

**Cash on Delivery** doesn't touch Razorpay at all — `POST /api/orders`
is called directly with `paymentMethod: "Cash on Delivery"` and
`paymentStatus: "Pending"`, same as the frontend does today.

---

## 8. Order creation contract

`POST /api/orders` — request body should match the frontend's `Order`
type minus server-generated fields:

```ts
// Request
{
  restaurantId: string;
  items: CartItem[];
  address: string;
  paymentMethod: "Razorpay" | "Cash on Delivery";
  couponCode?: string | null;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

// Response (matches frontend's Order type)
{
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
  paymentStatus: "Paid" | "Pending" | "Failed";
  orderStatus: "Order Confirmed";
  createdAt: string;
}
```

**Important:** recompute `subtotal`, `discount`, `tax`, and `total` on
the backend using the same formula as `lib/calculations.ts` — never trust
a total sent from the client. This prevents a tampered request from
paying less than the real price.

---

## 9. Order status updates

`PATCH /api/orders/:id/status` should only allow moving forward through
the same 5-step pipeline the frontend already renders:

```
Order Confirmed → Restaurant Accepted → Preparing → Out for Delivery → Delivered
```

Reject any request that tries to skip steps or move backward. This
endpoint would typically be called from a restaurant-facing dashboard or
an admin tool, not from the customer-facing app — the customer's
`/orders/:id` page would instead **poll** `GET /api/orders/:id` (or use a
WebSocket/SSE connection) to reflect status changes made by the
restaurant, instead of the current "Next Status" button that the
customer clicks themselves.

---

## 10. CORS & security checklist

- Restrict `CORS_ORIGIN` to your actual frontend domain(s).
- Rate-limit `/api/auth/*` and `/api/razorpay/*`.
- Validate all request bodies with `zod` before touching the database.
- Store passwords with `bcrypt`/`argon2`, never plaintext.
- Put `RAZORPAY_KEY_SECRET`, `DATABASE_URL`, and `JWT_SECRET` in your
  hosting provider's secret manager — never in a committed `.env` file.
- Verify Razorpay's payment signature server-side on **every** payment
  before marking an order `"Paid"` — never trust the frontend's `handler`
  callback alone, since a modified client could call your create-order
  endpoint directly and claim success without paying.

---

## 11. Migration path from the current frontend

You don't have to do this all at once. A reasonable order of operations:

1. Stand up the Express backend with just `GET /api/restaurants` and
   `GET /api/restaurants/:id/food`, backed by the **same mock data** you
   already have in `data/*.ts` (copy it server-side to start).
2. Swap the frontend's `data/restaurants.ts` / `data/food.ts` imports for
   `fetch` calls to those two endpoints. Everything else keeps working
   unchanged.
3. Add `POST /api/orders` and point `checkout/page.tsx`'s `createOrder()`
   at it instead of `lib/storage.ts`'s `addOrder()`. Keep `localStorage`
   as a fallback/cache if you like, or drop it.
4. Add real Razorpay order creation/verification per Section 7, and
   update `RazorpayCheckout.tsx` to call `create-order` before opening
   the modal, and `verify-payment` in the `handler` callback.
5. Add auth last, once orders are flowing through the backend correctly.
   Until then, orders can stay anonymous (guest checkout only).

This lets you ship incrementally without a big-bang rewrite, and the
frontend's component structure and types don't need to change — only
where the data comes from.
