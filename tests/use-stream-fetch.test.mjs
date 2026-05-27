import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useStreamFetch from "../hooks/use-stream-fetch.js";
import { createSseResponse } from "./mocks/handlers.mjs";
import { server } from "./mocks/server.mjs";
import { http } from "msw";

describe("useStreamFetch", () => {
  it("streams SSE deltas across chunk boundaries and handles multi-line data blocks", async () => {
    server.use(
      http.post("http://localhost/api/generate", () => {
        return createSseResponse([
          "event: de",
          "lta\ndata: {\"text\":\"Hello \"}\n\n",
          "event: delta\ndata: {\"text\":\"career world\"}\n\n",
          "event: done\ndata: {\"finalText\":\"Hello career world\",\n",
          "data: \"hasContent\":true}\n\n",
        ]);
      })
    );

    const { result } = renderHook(() => useStreamFetch());

    let outcome;
    await act(async () => {
      outcome = await result.current.startStream("Write a resume summary");
    });

    expect(outcome).toEqual({
      status: "done",
      finalText: "Hello career world",
      meta: { finalText: "Hello career world", hasContent: true },
    });
    expect(result.current.streamedText).toBe("Hello career world");
    expect(result.current.finalText).toBe("Hello career world");
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("surfaces malformed delta payloads instead of silently skipping them", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      server.use(
        http.post("http://localhost/api/generate", () => {
          return createSseResponse(["event: delta\ndata: {\"wrong\":true}\n\n"]);
        })
      );

      const { result } = renderHook(() => useStreamFetch());

      let outcome;
      await act(async () => {
        outcome = await result.current.startStream("Write a resume summary");
      });

      expect(outcome).toEqual({
        status: "error",
        error: "Malformed SSE delta payload",
        finalText: "",
      });
      expect(result.current.streamedText).toBe("");
      expect(result.current.finalText).toBe("");
      expect(result.current.error).toBe("Malformed SSE delta payload");
      expect(result.current.isLoading).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("extracts error messages from SSE rate-limit responses", async () => {
    server.use(
      http.post("http://localhost/api/generate", () => {
        return new Response(
          'event: error\ndata: {"error":"Too Many Requests","retryAfterSeconds":12}\n\n',
          {
            status: 429,
            headers: { "Content-Type": "text/event-stream; charset=utf-8" },
          }
        );
      })
    );

    const { result } = renderHook(() => useStreamFetch());

    let outcome;
    await act(async () => {
      outcome = await result.current.startStream("Write a resume summary");
    });

    expect(outcome).toEqual({
      status: "error",
      error: "Too Many Requests",
      finalText: "",
    });
    expect(result.current.error).toBe("Too Many Requests");
    expect(result.current.isLoading).toBe(false);
  });

  it("falls back to message fields for JSON errors", async () => {
    server.use(
      http.post("http://localhost/api/generate", () => {
        return new Response(JSON.stringify({ message: "No prompt provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    const { result } = renderHook(() => useStreamFetch());

    let outcome;
    await act(async () => {
      outcome = await result.current.startStream("Write a resume summary");
    });

    expect(outcome).toEqual({
      status: "error",
      error: "No prompt provided",
      finalText: "",
    });
    expect(result.current.error).toBe("No prompt provided");
    expect(result.current.isLoading).toBe(false);
  });
});