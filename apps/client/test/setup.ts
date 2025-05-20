import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { Element, Window } from 'happy-dom';
import { afterEach, expect, vi } from 'vitest';

// Setup HappyDOM
const window = new Window();
const document = window.document;

// Add Next.js specific properties
(window as any).__NEXT_DATA__ = {
    props: {},
    page: '',
    query: {},
    buildId: 'test'
};

// Use type assertions to handle the complex window types
global.document = document as unknown as Document;
global.window = window as any;
global.Element = Element as any;

// Stub the matchMedia function
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
    cleanup();
});
