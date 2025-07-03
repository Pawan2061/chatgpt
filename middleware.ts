import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// List of public routes that don't require authentication
const publicRoutes = ["/sign-in*", "/sign-up*"];

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  // Allow access to public routes
  if (
    publicRoutes.some((route) =>
      path.match(new RegExp(`^${route.replace("*", ".*")}$`))
    )
  ) {
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access protected route, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (userId && (path.startsWith("/sign-in") || path.startsWith("/sign-up"))) {
    const homeUrl = new URL("/", req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
