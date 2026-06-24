import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  if (request.auth) return NextResponse.next();

  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
