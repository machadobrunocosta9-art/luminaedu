import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth-session";

const PUBLIC_API_ROUTES = new Set([
  "/api/matricula/documentos/upload",
  "/api/matricula/documentos/registrar",
]);

function isPublicPage(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/matricula/convite" ||
    pathname.startsWith("/matricula/convite/") ||
    pathname === "/ciencia" ||
    pathname.startsWith("/ciencia/") ||
    pathname === "/responder" ||
    pathname.startsWith("/responder/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = await verifySessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD_HASH,
  );

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicPage(pathname) || PUBLIC_API_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
