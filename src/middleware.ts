import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromToken } from "@/lib/auth";

// Public routes that don't require auth
const PUBLIC_ROUTES = ["/", "/login", "/register", "/c", "/mock-payment"];
const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/cafes",
  "/api/menu",
  "/api/discovery",
  "/api/orders",
  "/api/table-service",
  "/api/the-usual",
  "/api/kds/stream",
  "/api/stock",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Allow public routes ────────────────────────────────────────────────────
  const isPublicRoute =
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ── Extract session token ──────────────────────────────────────────────────
  const token = request.cookies.get("cafechi_session")?.value;
  const session = token ? await getSessionFromToken(token) : null;

  if (!session) {
    // Redirect to login for page routes, 401 for API routes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "احراز هویت الزامی است" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── RBAC Enforcement ──────────────────────────────────────────────────────

  // /admin/* → SUPER_ADMIN only
  if (pathname.startsWith("/admin")) {
    if (session.role !== "SUPER_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "دسترسی محدود به مدیر ارشد" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // /owner/* → CAFE_OWNER only
  if (pathname.startsWith("/owner")) {
    if (session.role !== "CAFE_OWNER") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "دسترسی محدود به صاحبان کافه" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // /kds/* → STAFF or CAFE_OWNER
  if (pathname.startsWith("/kds")) {
    if (session.role !== "STAFF" && session.role !== "CAFE_OWNER") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "دسترسی محدود به پرسنل" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Attach user info to request headers for route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.sub);
  requestHeaders.set("x-user-role", session.role);
  requestHeaders.set("x-user-phone", session.phone);
  if (session.cafeId) {
    requestHeaders.set("x-cafe-id", session.cafeId);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts|images).*)",
  ],
};
