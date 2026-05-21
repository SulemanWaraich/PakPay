import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authSecret } from "./src/app/lib/authSecret";

type Role = "USER" | "MERCHANT" | "ADMIN";

function redirect(req: NextRequest, pathname: string, search?: Record<string, string>) {
  const url = new URL(pathname, req.url);
  if (search) {
    for (const [k, v] of Object.entries(search)) {
      url.searchParams.set(k, v);
    }
  }
  return NextResponse.redirect(url);
}

function homeForRole(role: Role | undefined): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "MERCHANT") return "/merchant/dashboard";
  return "/user/dashboard";
}

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;
  const isMerchant = pathname.startsWith("/merchant");
  const isUser = pathname.startsWith("/user");
  const isAdmin = pathname.startsWith("/admin");

  if (!isMerchant && !isUser && !isAdmin) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: authSecret(),
  });

  if (!token) {
    return redirect(request, "/auth/signin", {
      callbackUrl: pathname,
    });
  }

  const role = token.role as Role | undefined;

  if (isAdmin) {
    if (role !== "ADMIN") {
      return redirect(request, homeForRole(role));
    }
    return NextResponse.next();
  }

  if (isMerchant) {
    if (role !== "MERCHANT") {
      return redirect(request, homeForRole(role));
    }
    return NextResponse.next();
  }

  if (isUser) {
    if (role !== "USER") {
      return redirect(request, homeForRole(role));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
