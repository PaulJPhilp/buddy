import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";
import "@testing-library/jest-dom";
import { Effect, Runtime } from "effect";
import { JSDOM } from "jsdom";

// Create a JSDOM instance
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});

// Set up global variables
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.Node = dom.window.Node;
global.NodeList = dom.window.NodeList;
global.Text = dom.window.Text;
global.HTMLCollection = dom.window.HTMLCollection;
global.HTMLImageElement = dom.window.HTMLImageElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;
global.HTMLOptionElement = dom.window.HTMLOptionElement;
global.HTMLFormElement = dom.window.HTMLFormElement;
global.HTMLLabelElement = dom.window.HTMLLabelElement;
global.HTMLSpanElement = dom.window.HTMLSpanElement;
global.HTMLParagraphElement = dom.window.HTMLParagraphElement;
global.HTMLHeadingElement = dom.window.HTMLHeadingElement;
global.HTMLAnchorElement = dom.window.HTMLAnchorElement;
global.HTMLUListElement = dom.window.HTMLUListElement;
global.HTMLLIElement = dom.window.HTMLLIElement;
global.HTMLTableElement = dom.window.HTMLTableElement;
global.HTMLTableRowElement = dom.window.HTMLTableRowElement;
global.HTMLTableCellElement = dom.window.HTMLTableCellElement;
global.HTMLTableSectionElement = dom.window.HTMLTableSectionElement;
global.HTMLTableHeaderCellElement = dom.window.HTMLTableHeaderCellElement;
global.HTMLTableDataCellElement = dom.window.HTMLTableDataCellElement;
global.HTMLTableCaptionElement = dom.window.HTMLTableCaptionElement;
global.HTMLTableColElement = dom.window.HTMLTableColElement;
global.HTMLTableColGroupElement = dom.window.HTMLTableColGroupElement;
global.HTMLTableBodyElement = dom.window.HTMLTableBodyElement;
global.HTMLTableHeadElement = dom.window.HTMLTableHeadElement;
global.HTMLTableFootElement = dom.window.HTMLTableFootElement;

// Mock window.crypto for UUID generation
Object.defineProperty(global.window, "crypto", {
  value: {
    randomUUID: () => "test-uuid",
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock requestAnimationFrame
global.window.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

// Mock cancelAnimationFrame
global.window.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock ResizeObserver
global.window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.window.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock MutationObserver
global.window.MutationObserver = class MutationObserver {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  protocol = "";

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    if (typeof protocols === "string") {
      this.protocol = protocols;
    } else if (Array.isArray(protocols) && protocols.length > 0) {
      this.protocol = protocols[0];
    }

    // Simulate connection opening asynchronously
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 0);
  }

  send(data: string | ArrayBuffer | Blob) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    // In a real mock, you might want to simulate message handling
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose(
          new CloseEvent("close", {
            code: code || 1000,
            reason: reason || "",
            wasClean: true,
          }),
        );
      }
    }, 0);
  }

  addEventListener(type: string, listener: EventListener) {
    if (type === "open") this.onopen = listener as any;
    else if (type === "close") this.onclose = listener as any;
    else if (type === "message") this.onmessage = listener as any;
    else if (type === "error") this.onerror = listener as any;
  }

  removeEventListener(type: string, listener: EventListener) {
    if (type === "open" && this.onopen === listener) this.onopen = null;
    else if (type === "close" && this.onclose === listener) this.onclose = null;
    else if (type === "message" && this.onmessage === listener)
      this.onmessage = null;
    else if (type === "error" && this.onerror === listener) this.onerror = null;
  }

  dispatchEvent(event: Event): boolean {
    if (event.type === "open" && this.onopen) {
      this.onopen(event);
      return true;
    }if (event.type === "close" && this.onclose) {
      this.onclose(event as CloseEvent);
      return true;
    }if (event.type === "message" && this.onmessage) {
      this.onmessage(event as MessageEvent);
      return true;
    }if (event.type === "error" && this.onerror) {
      this.onerror(event);
      return true;
    }
    return false;
  }
};

// Also add to global scope
global.window.WebSocket = global.WebSocket;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};

Object.defineProperty(global.window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Also add to global scope
global.localStorage = localStorageMock;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Initialize Effect runtime
// beforeAll(() => {
//   Runtime.runSync(Effect.unit);
// });
