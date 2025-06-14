import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom";

console.log("🔧 Simple Vitest setup file is loading...");

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Add basic console notification
console.log("✅ Vitest setup complete - using happy-dom environment");
