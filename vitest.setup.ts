import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach } from "vitest";
import "@testing-library/jest-dom";

// Global DOM setup - runs once before all tests
beforeAll(() => {
  // Ensure we're in jsdom environment
  if (typeof window === "undefined") {
    throw new Error(
      "jsdom environment not properly initialized. Check vitest.config.ts",
    );
  }

  // Initialize localStorage with proper Storage interface
  if (
    !window.localStorage ||
    typeof window.localStorage.getItem !== "function"
  ) {
    const storage = new Map<string, string>();
    const localStorageImpl: Storage = {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, String(value)),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      get length() {
        return storage.size;
      },
      key: (index: number) => Array.from(storage.keys())[index] || null,
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageImpl,
      writable: false,
      configurable: false,
    });
  }

  // Initialize sessionStorage with proper Storage interface
  if (
    !window.sessionStorage ||
    typeof window.sessionStorage.getItem !== "function"
  ) {
    const storage = new Map<string, string>();
    const sessionStorageImpl: Storage = {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, String(value)),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      get length() {
        return storage.size;
      },
      key: (index: number) => Array.from(storage.keys())[index] || null,
    };
    Object.defineProperty(window, "sessionStorage", {
      value: sessionStorageImpl,
      writable: false,
      configurable: false,
    });
  }

  // Ensure global console is available
  if (!global.console) {
    global.console = console;
  }

  // Add any missing DOM APIs that might be needed
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  // Mock ResizeObserver if not available
  if (!window.ResizeObserver) {
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Mock IntersectionObserver if not available
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  console.log("✅ DOM environment initialized successfully");
});

// Per-test setup
beforeEach(() => {
  // Verify DOM environment is still available
  if (typeof window === "undefined") {
    throw new Error("DOM environment lost between tests");
  }

  // Clear storage before each test for isolation
  if (window.localStorage) {
    window.localStorage.clear();
  }
  if (window.sessionStorage) {
    window.sessionStorage.clear();
  }
});

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Initialize base test layer
// const BaseTestLayer = Layer.mergeAll(
//   WebSocketService.Default,
//   MdxService.Default,
//   ChatService.Default,
//   ChatInstanceService.Default
// );

// Make services available globally for tests
// beforeAll(async () => {
//   await Effect.runPromise(
//     Effect.provide(
//       Effect.unit,
//       BaseTestLayer
//     )
//   );
// });
