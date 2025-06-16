/**
 * @file DOM Test with manual setup
 */

import { renderHook } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { beforeAll, describe } from "vitest";

describe("DOM Test with Manual Setup", () => {
  beforeAll(() => {
    // Create a JSDOM instance
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "http://localhost",
      pretendToBeVisual: true,
    });

    // Set up global variables
    Object.defineProperty(globalThis, "window", {
      value: dom.window,
      writable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: dom.window.document,
      writable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: dom.window.navigator,
      writable: true,
    });

    // Set up other required globals
    global.Element = dom.window.Element;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;
  });

  // All theme-related tests have been removed.
});
