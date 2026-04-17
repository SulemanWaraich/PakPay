import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.ENFORCE_HTTPS === "true") {
    const proto = request.headers.get("x-forwarded-proto");
    if (proto === "http") {
      const host = request.headers.get("host") ?? request.nextUrl.host;
      const url = new URL(request.url);
      url.protocol = "https:";
      url.host = host;
      return NextResponse.redirect(url, 308);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
