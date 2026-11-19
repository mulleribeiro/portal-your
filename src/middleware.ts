import { NextResponse, type NextRequest } from "next/server";

export const LANG_COOKIE = "your_lang";
export const THEME_COOKIE = "your_theme";
const KNOWN = ["pt", "en", "es", "fr", "it", "de"];
const langPattern = /^[a-z]{2}(-[a-zA-Z]{2,4})?$/;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/api") || pathname.startsWith("/_next") ||
    pathname.includes(".") || pathname === "/admin" || pathname.startsWith("/admin/")
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && langPattern.test(first) && first.length <= 5) {
    const response = NextResponse.next();
    if (KNOWN.includes(first)) response.cookies.set(LANG_COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  const fromCookie = request.cookies.get(LANG_COOKIE)?.value;
  const accept = request.headers.get("accept-language")?.split(",")[0]?.slice(0, 2).toLowerCase();
  const target = fromCookie && langPattern.test(fromCookie) ? fromCookie : accept && KNOWN.includes(accept) ? accept : "pt";

  const url = request.nextUrl.clone();
  url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  const redirect = NextResponse.redirect(url);
  redirect.cookies.set(LANG_COOKIE, target, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return redirect;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
