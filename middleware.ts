import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/server/auth.config";

const ANON_COOKIE = "avolo_sid";
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const { auth } = NextAuth(authConfig);

/**
 * Middleware runs on the Edge runtime.
 * Responsibilities:
 *   1. Protect /profile/* — redirect to /login if unauthenticated
 *   2. Protect /admin/*  — redirect to / if not authenticated or not ADMIN
 *   3. Ensure every visitor has an `avolo_sid` httpOnly anonymous session cookie
 */
export default auth((req) => {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;

  // ── 1. Route protection ─────────────────────────────────────────────────────

  if (pathname.startsWith("/profile")) {
    if (!session) {
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/admin")) {
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }
  }

  // ── 2. Anonymous session cookie ─────────────────────────────────────────────

  const response = NextResponse.next();
  const existingCookie = cookies.get(ANON_COOKIE)?.value;

  if (!existingCookie) {
    const newId = crypto.randomUUID();
    response.cookies.set(ANON_COOKIE, newId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ANON_COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
