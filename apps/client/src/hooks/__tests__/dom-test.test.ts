/**
 * @file DOM Test with manual setup
 */

import { renderHook } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, test } from "vitest";
import { useChatTheme } from "../chat-theme/useChatTheme";

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

  test("should render hook with manual DOM setup", () => {
    const { result } = renderHook(() => useChatTheme());

    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe("object");
  });

  test("should handle theme override", () => {
    const themeOverride = { primaryColor: "#ff0000" };
    const { result } = renderHook(() => useChatTheme(themeOverride));

    expect(result.current.primaryColor).toBe("#ff0000");
  });
});
