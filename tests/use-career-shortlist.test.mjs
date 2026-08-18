import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCareerShortlist } from "../hooks/use-career-shortlist.js";

const STORAGE_KEY = "career-shortlist";

const sampleCareer = { id: "career-1", title: "Software Engineer" };
const sampleCareer2 = { id: "career-2", title: "Product Manager" };
const sampleCareer3 = { id: "career-3", title: "Data Scientist" };

let storage = {};

const createStorageMock = () => ({
  getItem: vi.fn((key) => storage[key] ?? null),
  setItem: vi.fn((key, value) => { storage[key] = value; }),
  removeItem: vi.fn((key) => { delete storage[key]; }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

describe("useCareerShortlist", () => {
  let storageMock;

  beforeEach(() => {
    storage = {};
    vi.clearAllMocks();

    storageMock = createStorageMock();
    Object.defineProperty(window, "localStorage", { value: storageMock, writable: true });
  });

  afterEach(() => {
    storage = {};
  });

  const waitForEffects = () =>
    act(async () => { await new Promise(r => setTimeout(r, 0)); });

  it("initializes with an empty shortlist when localStorage has no data", async () => {
    const { result, unmount } = renderHook(() => useCareerShortlist());
    await waitForEffects();

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.shortlist).toEqual([]);
    unmount();
  });

  it("loads valid shortlist from localStorage on mount", async () => {
    storage[STORAGE_KEY] = JSON.stringify([sampleCareer]);

    const { result, unmount } = renderHook(() => useCareerShortlist());
    await waitForEffects();

    expect(result.current.shortlist).toEqual([sampleCareer]);
    unmount();
  });

  it("sets empty shortlist and clears localStorage when stored data is not a valid career array", async () => {
    storage[STORAGE_KEY] = JSON.stringify({ foo: "bar" });

    const { result, unmount } = renderHook(() => useCareerShortlist());
    await waitForEffects();

    expect(result.current.shortlist).toEqual([]);
    expect(storageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    unmount();
  });

  it("isShortlisted returns true for shortlisted careers", async () => {
    storage[STORAGE_KEY] = JSON.stringify([sampleCareer]);

    const { result, unmount } = renderHook(() => useCareerShortlist());
    await waitForEffects();

    expect(result.current.isShortlisted("career-1")).toBe(true);
    expect(result.current.isShortlisted("career-2")).toBe(false);
    unmount();
  });

  it("toggleShortlist adds a career to the shortlist", async () => {
    storage[STORAGE_KEY] = JSON.stringify([]);

    const { result, unmount } = renderHook(() => useCareerShortlist());
    await waitForEffects();

    await act(async () => {
      result.current.toggleShortlist(sampleCareer);
    });

    expect(result.current.shortlist).toContainEqual(sampleCareer);
    expect(storageMock.setItem).toHaveBeenCalled();
    unmount();
  });

  it("toggleShortlist removes a career from the shortlist", async () => {
    storage[STORAGE_KEY] = JSON.stringify([sampleCareer]);

    const { result, unmount } = renderHook(() => useCareerShortlist());
    await waitForEffects();

    await act(async () => {
      result.current.toggleShortlist(sampleCareer);
    });

    expect(result.current.shortlist).not.toContainEqual(sampleCareer);
    unmount();
  });

  it("clearShortlist removes all careers", async () => {
    storage[STORAGE_KEY] = JSON.stringify([sampleCareer, sampleCareer2]);

    const { result, unmount } = renderHook(() => useCareerShortlist());
    await waitForEffects();

    await act(async () => {
      result.current.clearShortlist();
    });

    expect(result.current.shortlist).toEqual([]);
    unmount();
  });

  it("syncs shortlist from localStorage when storage event fires from another tab", async () => {
    storage[STORAGE_KEY] = JSON.stringify([sampleCareer]);

    const { result, unmount } = renderHook(() => useCareerShortlist());
    await waitForEffects();

    // Simulate a storage event from another tab
    const storageEvent = new StorageEvent("storage", {
      key: STORAGE_KEY,
      newValue: JSON.stringify([sampleCareer, sampleCareer2]),
    });

    act(() => {
      window.dispatchEvent(storageEvent);
    });

    expect(result.current.shortlist).toEqual([sampleCareer, sampleCareer2]);
    unmount();
  });
});
