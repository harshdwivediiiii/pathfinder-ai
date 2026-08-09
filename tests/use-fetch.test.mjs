import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useFetch from "../hooks/use-fetch.js";
import { toast } from "sonner";

let toastErrorSpy;

describe("useFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const waitForState = () =>
    act(async () => { await new Promise(r => setTimeout(r, 10)); });

  describe("initial state", () => {
    it("initializes with data undefined, loading null, error null", () => {
      const mockCb = vi.fn();
      const { result } = renderHook(() => useFetch(mockCb));

      expect(result.current.data).toBeUndefined();
      expect(result.current.loading).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("fn() - successful call", () => {
    it("sets data on successful response", async () => {
      const mockCb = vi.fn().mockResolvedValueOnce({ success: true, data: { id: 1 } });
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      await act(async () => { result.current.fn(); });
      await waitForState();

      expect(mockCb).toHaveBeenCalled();
      expect(result.current.data).toEqual({ success: true, data: { id: 1 } });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      unmount();
    });

    it("sets loading true during the call", async () => {
      let resolveCallback;
      const mockCb = vi.fn().mockImplementationOnce(
        () => new Promise(resolve => { resolveCallback = resolve; })
      );
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      let loadingDuringCall;
      act(() => {
        result.current.fn();
      });
      // Check loading state immediately after call
      loadingDuringCall = result.current.loading;

      await act(async () => { resolveCallback({ success: true, data: {} }); });
      await waitForState();

      expect(loadingDuringCall).toBe(true);
      expect(result.current.loading).toBe(false);
      unmount();
    });
  });

  describe("fn() - error handling", () => {
    it("sets error when callback throws", async () => {
      const mockCb = vi.fn().mockRejectedValueOnce(new Error("Network error"));
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      await act(async () => { result.current.fn(); });
      await waitForState();

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe("Network error");
      expect(result.current.data).toBeUndefined();
      unmount();
    });

    it("extracts error string from response.error field", async () => {
      const mockCb = vi.fn().mockResolvedValueOnce({
        success: false,
        error: "Something went wrong",
      });
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      await act(async () => { result.current.fn(); });
      await waitForState();

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe("Something went wrong");
      unmount();
    });

    it("extracts error from response.errors object with string array value", async () => {
      const mockCb = vi.fn().mockResolvedValueOnce({
        success: false,
        errors: { name: ["Name is required", "Name is too short"] },
      });
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      await act(async () => { result.current.fn(); });
      await waitForState();

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe("Name is required");
      unmount();
    });

    it("extracts error from response.errors object with string value", async () => {
      const mockCb = vi.fn().mockResolvedValueOnce({
        success: false,
        errors: { email: "Invalid email address" },
      });
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      await act(async () => { result.current.fn(); });
      await waitForState();

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe("Invalid email address");
      unmount();
    });

    it("throws generic error when response.success is false without specific error message", async () => {
      const mockCb = vi.fn().mockResolvedValueOnce({ success: false });
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      await act(async () => { result.current.fn(); });
      await waitForState();

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe("An error occurred");
      unmount();
    });

    it("throws when response.error exists but response.data is null", async () => {
      const mockCb = vi.fn().mockResolvedValueOnce({ error: "Server error", data: null });
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      await act(async () => { result.current.fn(); });
      await waitForState();

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe("Server error");
      unmount();
    });
  });

  describe("setData", () => {
    it("manually sets data via setData", () => {
      const mockCb = vi.fn();
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      act(() => {
        result.current.setData({ id: 42 });
      });

      expect(result.current.data).toEqual({ id: 42 });
      unmount();
    });
  });

  describe("fn() with arguments", () => {
    it("passes arguments to the callback", async () => {
      const mockCb = vi.fn().mockResolvedValueOnce({ success: true });
      const { result, unmount } = renderHook(() => useFetch(mockCb));

      await act(async () => {
        result.current.fn("arg1", "arg2", { option: true });
      });
      await waitForState();

      expect(mockCb).toHaveBeenCalledWith("arg1", "arg2", { option: true });
      unmount();
    });
  });
});
