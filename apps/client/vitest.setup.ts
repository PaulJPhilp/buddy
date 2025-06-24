import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { WebSocket, WebSocketServer } from "ws";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Real ResizeObserver implementation
global.ResizeObserver = class ResizeObserver {
  private callback: ResizeObserverCallback;
  private observedElements = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.observedElements.add(element);
    // Trigger callback with initial size
    const entry = {
      target: element,
      contentRect: element.getBoundingClientRect(),
      borderBoxSize: [{ inlineSize: 0, blockSize: 0 }],
      contentBoxSize: [{ inlineSize: 0, blockSize: 0 }],
      devicePixelContentBoxSize: [{ inlineSize: 0, blockSize: 0 }],
    } as ResizeObserverEntry;
    this.callback([entry], this);
  }

  unobserve(element: Element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }
};

// Real IntersectionObserver implementation
global.IntersectionObserver = class IntersectionObserver {
  private callback: IntersectionObserverCallback;
  private observedElements = new Set<Element>();

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.observedElements.add(element);
    // Trigger callback with initial intersection
    const entry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 1,
      intersectionRect: element.getBoundingClientRect(),
      boundingClientRect: element.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now(),
    } as IntersectionObserverEntry;
    this.callback([entry], this);
  }

  unobserve(element: Element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }
};

// Real matchMedia implementation
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string): MediaQueryList => {
    const mql = {
      matches: false,
      media: query,
      onchange: null,
      addListener: (
        listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void,
      ) => {
        mql.addEventListener("change", listener);
      },
      removeListener: (
        listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void,
      ) => {
        mql.removeEventListener("change", listener);
      },
      addEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        // Real implementation would manage listeners
      },
      removeEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        // Real implementation would manage listeners
      },
      dispatchEvent: (event: Event): boolean => {
        return true;
      },
    } as MediaQueryList;
    return mql;
  },
});

// Real scrollTo implementations
Element.prototype.scrollTo = function (
  options?: ScrollToOptions | number,
  y?: number,
) {
  if (typeof options === "number") {
    this.scrollLeft = options;
    this.scrollTop = y || 0;
  } else if (options) {
    if (options.left !== undefined) this.scrollLeft = options.left;
    if (options.top !== undefined) this.scrollTop = options.top;
  }
};

HTMLElement.prototype.scrollTo = function (
  options?: ScrollToOptions | number,
  y?: number,
) {
  if (typeof options === "number") {
    this.scrollLeft = options;
    this.scrollTop = y || 0;
  } else if (options) {
    if (options.left !== undefined) this.scrollLeft = options.left;
    if (options.top !== undefined) this.scrollTop = options.top;
  }
};

window.scrollTo = (options?: ScrollToOptions | number, y?: number) => {
  if (typeof options === "number") {
    window.scrollX = options;
    window.scrollY = y || 0;
  } else if (options) {
    if (options.left !== undefined) window.scrollX = options.left;
    if (options.top !== undefined) window.scrollY = options.top;
  }
};

// Provide real WebSocket implementation for Node environment
// @ts-expect-error - WebSocket global assignment
global.WebSocket = WebSocket;
// @ts-expect-error - WebSocketServer global assignment
global.WebSocketServer = WebSocketServer;

console.log("✅ Vitest setup complete - NO MOCKS, all real implementations");
