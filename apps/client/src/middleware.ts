import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/trpc(.*)",
  "/api/configs(.*)",
  "/api/agent(.*)",
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
