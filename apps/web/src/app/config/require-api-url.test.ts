import { describe, expect, it } from "vitest";
import { requireApiUrl } from "./require-api-url";

describe("requireApiUrl", () => {
  it("rejects a production build without an API URL", () => {
    expect(() => requireApiUrl("production", undefined)).toThrow(
      "VITE_API_URL must be set for production builds"
    );
    expect(() => requireApiUrl("production", "  ")).toThrow(
      "VITE_API_URL must be set for production builds"
    );
  });

  it("rejects local and malformed API URLs in production", () => {
    expect(() => requireApiUrl("production", "http://localhost:3000")).toThrow(
      "VITE_API_URL must be an HTTPS origin for production builds"
    );
    expect(() => requireApiUrl("production", "https://api.nutrigon.ar/api/v1")).toThrow(
      "VITE_API_URL must be an HTTPS origin for production builds"
    );
    expect(() => requireApiUrl("production", "not a URL")).toThrow(
      "VITE_API_URL must be an HTTPS origin for production builds"
    );
  });

  it("allows configured production and local development builds", () => {
    expect(() => requireApiUrl("production", "https://api.nutrigon.ar")).not.toThrow();
    expect(() => requireApiUrl("development", undefined)).not.toThrow();
  });
});
