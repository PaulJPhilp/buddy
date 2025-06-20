/* eslint-disable no-console */

// Shared, runtime-toggleable debug logger.
// Usage:
//   import { debugLog } from "@/utils/debugLogger";
//   debugLog("ChatService:init", { some: "payload" });
//
// In the browser console you can enable/disable logs via:
//   window.buddyDebug = true  // show logs
//   window.buddyDebug = false // hide logs (default)

// Ensure the global flag exists on the Window type.
declare global {
  interface Window {
    buddyDebug?: boolean;
  }
}

/**
 * Print a debug message only when the global flag is set.
 * The first argument is a short scope identifier (e.g. "WebSocketService:send").
 */
export function debugLog(scope: string, ...args: unknown[]): void {
  if (typeof window !== "undefined" && !window.buddyDebug) return;

  console.log(
    `%c[Buddy-Debug] ${scope}`,
    "color:#888;font-size:0.8rem;font-weight:bold;",
    ...args,
  );
}

// -----------------------------------------------------------
// Optional enhancement (step 4): pipe all console.log calls
// through the same runtime flag so legacy logs don't overwhelm
// the console in production. Only active in the browser.
// -----------------------------------------------------------
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console -- we need the original reference
  const originalLog = console.log.bind(console);

  // eslint-disable-next-line no-console -- we intentionally patch it
  console.log = (...args: unknown[]) => {
    if (window.buddyDebug) {
      // Forward to the real console.log when debugging is enabled
      originalLog(...args);
    }
  };
}

// -----------------------------------------------------------
// Persisted debug flag helpers
// -----------------------------------------------------------
if (typeof window !== "undefined") {
  // Bootstrap: read any persisted value
  const persisted = window.localStorage.getItem("buddyDebug");
  if (persisted === "true") {
    window.buddyDebug = true;
  }

  // Expose helper to toggle & persist
  window.setBuddyDebug = (value: boolean) => {
    window.buddyDebug = value;
    if (value) {
      window.localStorage.setItem("buddyDebug", "true");
      console.info("[Buddy-Debug] enabled (persisted)");
    } else {
      window.localStorage.removeItem("buddyDebug");
      console.info("[Buddy-Debug] disabled (persisted)");
    }
  };
}
