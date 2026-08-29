import { NextResponse } from "next/server";

// Add any other routes that require login here.
const PROTECTED_PATHS = ["/cart", "/checkout"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // NOTE: this only checks whether the cookie exists, not whether the JWT
  // is still valid/unexpired (verifying the signature on the edge runtime
  // needs a jose-based check with your JWT_SECRET, since `jsonwebtoken`
  // doesn't run there). That's why ProtectedRoute also calls /auth/me
  // client-side — that call hits your Express server, which does the real
  // verification. Treat this middleware as a fast first pass only.
  const token = request.cookies.get("token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cart/:path*", "/checkout/:path*"],
};