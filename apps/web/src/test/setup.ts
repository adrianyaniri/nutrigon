import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// Increase default async timeout from 1000ms to 4000ms to avoid flaky timeouts during heavy multi-worker runs
configure({ asyncUtilTimeout: 4000 });

// Mock matchMedia for responsive UI components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
