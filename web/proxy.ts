import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth-session";
import {
  hasPermission,
  permissionForAdminPath,
} from "@/lib/security/permissions";
import {
  USER_SESSION_COOKIE,
  verifyUserSessionToken,
} from "@/lib/user-session-token";

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
    pathname.startsWith("/responder/") ||
    pathname === "/ativar-conta" ||
    pathname.startsWith("/ativar-conta/") ||
    pathname === "/recuperar-senha" ||
    pathname.startsWith("/recuperar-senha/")
  );
}

function isFamilyRoute(pathname: string) {
  return (
    pathname === "/portal-familia" ||
    pathname.startsWith("/portal-familia/") ||
    pathname.startsWith("/api/portal-familia/")
  );
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [legacyAuthenticated, userSession] = await Promise.all([
    verifySessionToken(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_PASSWORD_HASH,
    ),
    verifyUserSessionToken(
      request.cookies.get(USER_SESSION_COOKIE)?.value,
    ),
  ]);

  if (pathname === "/login") {
    if (userSession?.papel === "RESPONSAVEL") {
      return NextResponse.redirect(new URL("/portal-familia", request.url));
    }

    if (legacyAuthenticated || userSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isPublicPage(pathname) || PUBLIC_API_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  if (isFamilyRoute(pathname)) {
    if (userSession?.papel === "RESPONSAVEL") {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    return legacyAuthenticated || userSession
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : redirectToLogin(request);
  }

  if (legacyAuthenticated) {
    return NextResponse.next();
  }

  if (
    userSession &&
    hasPermission(userSession.papel, permissionForAdminPath(pathname))
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: userSession ? "Acesso negado." : "Não autorizado." },
      { status: userSession ? 403 : 401 },
    );
  }

  if (userSession?.papel === "RESPONSAVEL") {
    return NextResponse.redirect(new URL("/portal-familia", request.url));
  }

  return userSession
    ? NextResponse.redirect(new URL("/dashboard", request.url))
    : redirectToLogin(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
