import { NextResponse } from "next/server";

export function proxy(request) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // 1. Skip static files, api requests, and assets
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Identify subdomain
  let subdomain = "";
  if (hostname.endsWith("localhost:3000")) {
    // Local development subdomain routing (e.g. gold-gym-bilaspur.localhost:3000)
    const cleanedHost = hostname.replace(":3000", "");
    const parts = cleanedHost.split(".");
    if (parts.length > 1 && parts[0] !== "localhost") {
      subdomain = parts[0];
    }
  } else {
    // Production subdomain routing (e.g. gold-gym-bilaspur.flexflow.com)
    const parts = hostname.split(".");
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  // 3. Rewrite requests if accessing via a custom gym subdomain
  if (
    subdomain &&
    subdomain !== "www" &&
    subdomain !== "app" &&
    subdomain !== "admin"
  ) {
    // Rewrite root request '/' to the member join page for that gym
    if (url.pathname === "/") {
      url.pathname = `/join/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

// Configure matcher to run on page paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
