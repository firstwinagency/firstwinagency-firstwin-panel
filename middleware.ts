import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ DEJAR PASAR TODAS LAS API ROUTES
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // (opcional pero recomendable)
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const basicAuth = request.headers.get("authorization");

  if (basicAuth) {
    const auth = basicAuth.split(" ")[1];
    const [user, pwd] = atob(auth).split(":");

    if (
      user === process.env.PANEL_USER &&
      pwd === process.env.PANEL_PASS
    ) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Auth required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
  });
}
