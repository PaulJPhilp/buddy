import { loadAndInitializeConfiguration } from "@/services/configuration";
import { Effect } from "effect";

/**
 * Loads a Buddy bootstrap config from a file and initializes the runtime.
 * Only allowed in development mode (process.env.NODE_ENV === 'development').
 */
export function handleBootstrapFileDevOnly(file: File) {
  if (process.env.NODE_ENV !== "development") {
    // Silently ignore or log
    console.warn(
      "Buddy bootstrap loading from disk is only allowed in development mode.",
    );
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    const json = event.target?.result as string;
    // Save to localStorage
    localStorage.setItem("buddy:bootstrap", json);
    // Optionally initialize runtime immediately
    void Effect.runPromise(loadAndInitializeConfiguration(json));
  };
  reader.readAsText(file);
}

/**
 * On startup, only initialize from localStorage if in dev mode.
 */
export function initializeBootstrapFromLocalStorageDevOnly() {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  const json = localStorage.getItem("buddy:bootstrap");
  if (json) {
    void Effect.runPromise(loadAndInitializeConfiguration(json));
  }
}
