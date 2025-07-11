import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/chatapp-dev(.*)", // Chat app development page - public for development
  "/app-manager(.*)", // Temporarily public for testing
  "/app-manager-test(.*)", // Simple test route
  "/app-manager-debug(.*)", // Debug route
  "/simple-debug(.*)", // Simple debug route
  "/test-hydration(.*)", // Hydration test route
  "/test-no-clerk(.*)", // Test without Clerk
  "/api/webhooks(.*)",
  "/api/trpc(.*)",
  "/api/configs(.*)",
  "/api/agent(.*)",
  "/api/hello(.*)",
  "/api/workspace(.*)",
  "/api/chatapps(.*)",
  "/configs(.*)", // Allow access to static config files
  "/static/configs(.*)", // Allow access to static config files in /static directory
  "/_next(.*)",
  "/(assets|images|favicon.ico)(.*)",
  "/theme-test(.*)",
  "/test-chat-instance(.*)",
  "/simple-test(.*)",
  "/chat-test(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  console.log("using middleware.");
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
