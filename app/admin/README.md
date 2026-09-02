# TastyGo Admin — Next.js frontend

A small admin dashboard (App Router) that talks to your existing Express
API at `/api/admin/*`. It does **not** touch Postgres directly — every
request goes through your Express server, which already has the Neon
connection.

## 1. Drop this into a Next.js project

If you don't have one yet:
```
npx create-next-app@latest tastygo-admin-frontend
```
When prompted, choose: App Router = yes, Tailwind = your choice (this
UI uses plain CSS, not Tailwind, so either answer is fine — nothing
here depends on Tailwind being installed).

Then copy this folder's `app/`, `components/`, `lib/`, and
`.env.local.example` into your Next.js project root, merging with
what `create-next-app` scaffolded (overwrite `app/layout.js`,
`app/page.js`, `app/globals.css`).

## 2. Env

```
cp .env.local.example .env.local
```
Set `NEXT_PUBLIC_API_URL` to wherever your Express server runs
(`http://localhost:5000` in dev).

## 3. CORS — already set up correctly

Your `server.js` already allows `http://localhost:3000` with
`credentials: true`, and your auth cookie is `httpOnly` +
`sameSite: "lax"` in dev. Since `localhost:3000` and `localhost:5000`
are the same registrable domain (only the port differs), the browser
treats them as same-site, so the cookie is sent automatically on
`fetch` calls that use `credentials: "include"` — which every call in
`lib/api.js` does. Nothing to change here for local dev.

In production, if the frontend and API end up on different domains,
your existing `sameSite: "none"` + `secure: true` cookie config
(already conditional on `NODE_ENV === "production"`) handles that case
too — just make sure the frontend's real domain is added to
`allowedOrigins` in `server.js`.

## 4. Run it

```
npm run dev
```
Visit `http://localhost:3000` — it redirects to `/admin`, which
redirects to `/admin/login` if you're not authenticated. Log in with
the email you promoted to `role = 'admin'` in Neon.

## 5. What's included

- `/admin` — dashboard with order/revenue stats
- `/admin/restaurants` — list, search, create, edit, delete
- `/admin/restaurants/[id]/food` — menu management for one restaurant,
  including a one-click "86'd" toggle for availability
- `/admin/orders` — filterable list (status, payment), inline status
  updates, expandable row for full order details
- `/admin/coupons` — list, create, edit, delete
- `/admin/login` — OTP-based login matching your existing
  `request-otp` / `verify-otp` flow. Rejects non-admin accounts after
  verification.

Auth is enforced client-side by calling `GET /api/auth/me` on load
(see `lib/auth-context.js`) — this is necessary because the auth
cookie lives on the API's origin and Next.js middleware on the
frontend's origin can't read it. Every admin API call already gets
re-checked server-side by your `authenticate` + `requireAdmin`
middleware regardless, so this client-side gate is just for UX
(hiding pages, redirecting), not the actual security boundary.

## 6. Things to double check against your real schema

The UI reads response fields defensively (`r.delivery_time ??
r.deliveryTime`, etc.) since I don't have your actual controller
output in front of me — but if your `/api/admin/*` responses use
different key casing than what I assumed, some fields may show as
"—". Open the browser console/network tab on any page that looks off
and compare the JSON shape to what the components expect; happy to
adjust once I see it.
