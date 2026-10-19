import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "./use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value immediately and updates after the specified delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "", delay: 300 } }
    );

    expect(result.current).toBe("");

    rerender({ value: "almendra", delay: 300 });
    expect(result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("almendra");
  });

  it("resets immediately when cleared to empty string", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "nueces" } }
    );

    expect(result.current).toBe("nueces");

    rerender({ value: "" });
    expect(result.current).toBe("");
  });
});
