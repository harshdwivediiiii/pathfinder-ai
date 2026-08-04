import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual };
});

describe("useKeyboardShortcuts", () => {
  let addEventListenerSpy;
  let removeEventListenerSpy;
  let triggerKeyDown;

  beforeEach(() => {
    vi.clearAllMocks();
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupHook = (shortcuts) => {
    // Import fresh each time to get a new module instance
    return import("../hooks/useKeyboardShortcuts.ts").then(({ useKeyboardShortcuts }) => {
      const utils = renderHook(() => useKeyboardShortcuts(shortcuts));
      return utils;
    });
  };

  it("registers a keydown listener on mount and cleans up on unmount", async () => {
    const utils = await setupHook({});
    expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    utils.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("calls the registered shortcut when matching key is pressed", async () => {
    const handler = vi.fn();
    const utils = await setupHook({ "alt+1": handler });

    // Find the listener registered on window
    const listener = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "keydown"
    )[1];

    // Simulate Alt+1
    const event = new KeyboardEvent("keydown", { key: "1", altKey: true, bubbles: true });
    Object.defineProperty(event, "target", { value: { tagName: "DIV" }, writable: false });
    listener(event);

    expect(handler).toHaveBeenCalledTimes(1);
    utils.unmount();
  });

  it("does not call shortcut when key is pressed in an input element", async () => {
    const handler = vi.fn();
    const utils = await setupHook({ "alt+1": handler });

    const listener = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "keydown"
    )[1];

    // Simulate keydown inside an INPUT element
    const input = document.createElement("input");
    const event = new KeyboardEvent("keydown", { key: "1", altKey: true, bubbles: true });
    Object.defineProperty(event, "target", { value: input, writable: false });
    listener(event);

    expect(handler).not.toHaveBeenCalled();
    utils.unmount();
  });

  it("does not call shortcut when key is pressed in a textarea", async () => {
    const handler = vi.fn();
    const utils = await setupHook({ "ctrl+k": handler });

    const listener = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "keydown"
    )[1];

    const textarea = document.createElement("textarea");
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true });
    Object.defineProperty(event, "target", { value: textarea, writable: false });
    listener(event);

    expect(handler).not.toHaveBeenCalled();
    utils.unmount();
  });

  it("does not call shortcut when key is pressed in contenteditable", async () => {
    const handler = vi.fn();
    const utils = await setupHook({ "shift+s": handler });

    const listener = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "keydown"
    )[1];

    const div = document.createElement("div");
    div.contentEditable = "true";
    const event = new KeyboardEvent("keydown", { key: "s", shiftKey: true, bubbles: true });
    Object.defineProperty(event, "target", { value: div, writable: false });
    listener(event);

    expect(handler).not.toHaveBeenCalled();
    utils.unmount();
  });

  it("handles ctrl key (also maps from metaKey)", async () => {
    const handler = vi.fn();
    const utils = await setupHook({ "ctrl+s": handler });

    const listener = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "keydown"
    )[1];

    const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true });
    Object.defineProperty(event, "target", { value: { tagName: "DIV" }, writable: false });
    listener(event);

    expect(handler).toHaveBeenCalledTimes(1);
    utils.unmount();
  });

  it("calls preventDefault when a matching shortcut is triggered", async () => {
    const handler = vi.fn();
    const utils = await setupHook({ "alt+2": handler });

    const listener = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "keydown"
    )[1];

    const event = new KeyboardEvent("keydown", { key: "2", altKey: true, bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    Object.defineProperty(event, "target", { value: { tagName: "DIV" }, writable: false });
    listener(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    utils.unmount();
  });
});
