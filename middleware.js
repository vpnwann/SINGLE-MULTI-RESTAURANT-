import { NextResponse } from "next/server";

// Route protection now happens entirely client-side, in <ProtectedRoute>.
//
// Why: the auth cookie is set by the Express API on its own domain
// (e.g. savhorserver.onrender.com), not on this Next.js app's domain
// (e.g. localhost:3000 or your Vercel deployment). Edge middleware here
// only ever sees cookies attached to requests made *to this app*, so it
// can never see a cookie that belongs to a different origin — it would
// always look logged-out and redirect in a loop, even right after a
// successful login.
//
// ProtectedRoute calls /api/auth/me directly against the API's own
// domain with credentials included, which does carry the cookie
// correctly, so that's the source of truth for auth state.
//
// If you later put the API behind the same domain as this app (e.g. via
// a Next.js rewrite/proxy so both are first-party), you can reintroduce
// a fast edge check here as an optimization — but it's optional, not
// required for correctness.

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};