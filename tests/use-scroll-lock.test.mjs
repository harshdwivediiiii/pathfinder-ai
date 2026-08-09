import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollLock } from "../hooks/use-scroll-lock.js";

describe("useScrollLock", () => {
  const originalOverflow = document.body.style.overflow;

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
    vi.restoreAllMocks();
  });

  it("does not modify overflow when isLocked is false on initial render", () => {
    const { result, unmount } = renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe(originalOverflow);
    unmount();
  });

  it("sets body overflow to hidden when isLocked becomes true", () => {
    const { result, rerender, unmount } = renderHook(
      ({ locked }) => useScrollLock(locked),
      { initialProps: { locked: false } }
    );

    expect(document.body.style.overflow).toBe(originalOverflow);

    rerender({ locked: true });
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
  });

  it("restores original overflow when isLocked becomes false", () => {
    const { result, rerender, unmount } = renderHook(
      ({ locked }) => useScrollLock(locked),
      { initialProps: { locked: true } }
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender({ locked: false });
    expect(document.body.style.overflow).toBe(originalOverflow);

    unmount();
  });

  it("restores overflow on unmount even when locked", () => {
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it("does not crash on repeated toggles", () => {
    const { rerender, unmount } = renderHook(
      ({ locked }) => useScrollLock(locked),
      { initialProps: { locked: false } }
    );

    rerender({ locked: true });
    expect(document.body.style.overflow).toBe("hidden");

    rerender({ locked: false });
    expect(document.body.style.overflow).toBe(originalOverflow);

    rerender({ locked: true });
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe(originalOverflow);
  });
});
