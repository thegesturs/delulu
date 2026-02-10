import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const country = req.headers.get("cf-ipcountry") || "US";
  const response = NextResponse.next();
  response.cookies.set("x-geo-country", country, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 86_400,
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
