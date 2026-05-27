"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const MAX_SSE_BUFFER_SIZE = 1024 * 1024;

/**
 * Custom hook that streams AI responses from the /api/generate SSE endpoint.
 *
 * Incoming SSE chunks can be large (whole sentences). This hook buffers them
 * and releases 2-3 words at a time on a short interval so the UI types
 * smoothly instead of jumping in big chunks.
 *
 * Usage:
 *   const { streamedText, isLoading, error, startStream, reset } = useStreamFetch();
 *   startStream("Write a cover letter for...");
 */
export default function useStreamFetch() {
  const [streamedText, setStreamedText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isDev = process.env.NODE_ENV !== "production";

  const abortControllerRef = useRef(null);

  const parseSseEventBlock = useCallback((block) => {
    const lines = block.split(/\r?\n/);
    let event = "message";
    const dataLines = [];

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (!line || line.startsWith(":")) {
        continue;
      }

      if (line.startsWith("event:")) {
        event = line.slice(6).trim() || "message";
        continue;
      }

      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    return {
      event,
      data: dataLines.join("\n"),
    };
  }, []);

  const failStream = useCallback(
    async (reader, message, details, currentText) => {
      if (isDev) {
        console.warn("[useStreamFetch] " + message, details);
      }

      setError(message);
      setIsLoading(false);
      await reader.cancel();

      return { status: "error", error: message, finalText: currentText };
    },
    [isDev]
  );

  const startStream = useCallback(async (prompt, conversationId = null) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000);

    setStreamedText("");
    setFinalText("");
    setError(null);
    setIsLoading(true);

    try {
      const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          conversationId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const contentType = (response.headers.get("Content-Type") || "").toLowerCase();
        let parsed = {};

        if (contentType.includes("text/event-stream")) {
          const rawText = await response.text();
          const { data } = parseSseEventBlock(rawText);

          if (data) {
            try {
              parsed = JSON.parse(data);
            } catch (parseError) {
              if (isDev) {
                console.warn("[useStreamFetch] Failed to parse SSE error payload", parseError, data);
              }
            }
          }
        } else {
          parsed = await response.json().catch(() => ({}));
        }

        const errorMessage =
          (typeof parsed.error === "string" && parsed.error) ||
          (typeof parsed.message === "string" && parsed.message) ||
          `Request failed (${response.status})`;

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("Readable stream not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";
      let currentEvent = {
        event: "message",
        dataLines: [],
      };

      const resetCurrentEvent = () => {
        currentEvent = {
          event: "message",
          dataLines: [],
        };
      };

      const finalizeCurrentEvent = () => {
        const event = currentEvent.event;
        const data = currentEvent.dataLines.join("\n");

        resetCurrentEvent();

        if (event === "message" && !data) {
          return null;
        }

        return { event, data };
      };

      const handleParsedEvent = async ({ event, data }) => {
        let parsed = {};

        if (data) {
          try {
            parsed = JSON.parse(data);
          } catch (parseError) {
            return failStream(
              reader,
              `Malformed SSE ${event} payload`,
              { event, data, parseError },
              accumulatedText
            );
          }
        }

        if (event === "delta") {
          if (typeof parsed.text !== "string") {
            return failStream(
              reader,
              "Malformed SSE delta payload",
              { event, parsed },
              accumulatedText
            );
          }

          accumulatedText += parsed.text;
          setStreamedText(accumulatedText);
          return null;
        }

        if (event === "error") {
          const message =
            (typeof parsed.message === "string" && parsed.message) ||
            "Stream failed";

          setError(message);
          setIsLoading(false);
          await reader.cancel();
          return { status: "error", error: message, finalText: accumulatedText };
        }

        if (event === "done") {
          const completeText =
            typeof parsed.finalText === "string" ? parsed.finalText : accumulatedText;

          accumulatedText = completeText;
          setFinalText(completeText);
          setStreamedText(completeText);
          setIsLoading(false);
          await reader.cancel();
          return { status: "done", finalText: completeText, meta: parsed };
        }

        return null;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            try {
              const completeEvent = parseSseEventBlock(buffer);
              const result = await handleParsedEvent(completeEvent);

              if (result) {
                return result;
              }
            } catch (error) {
              return failStream(
                reader,
                "Malformed SSE stream: incomplete event at end",
                { buffer, error },
                accumulatedText
              );
            }
          }

          const fallbackFinal = accumulatedText;
          setFinalText(fallbackFinal);
          setStreamedText(fallbackFinal);
          setIsLoading(false);
          return { status: "done", finalText: fallbackFinal };
        }

        buffer += decoder.decode(value, { stream: true });

        if (buffer.length > MAX_SSE_BUFFER_SIZE) {
          return failStream(
            reader,
            "SSE buffer exceeded maximum size",
            { bufferLength: buffer.length },
            accumulatedText
          );
        }

        while (true) {
          const newlineIndex = buffer.indexOf("\n");
          if (newlineIndex === -1) {
            break;
          }

          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) {
            line = line.slice(0, -1);
          }

          if (!line) {
            const completeEvent = finalizeCurrentEvent();
            if (!completeEvent) {
              continue;
            }

            const result = await handleParsedEvent(completeEvent);
            if (result) {
              return result;
            }

            continue;
          }

          if (line.startsWith(":")) {
            continue;
          }

          const colonIndex = line.indexOf(":");
          const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
          let value = colonIndex === -1 ? "" : line.slice(colonIndex + 1);

          if (value.startsWith(" ")) {
            value = value.slice(1);
          }

          if (field === "event") {
            currentEvent.event = value || "message";
            continue;
          }

          if (field === "data") {
            currentEvent.dataLines.push(value);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setIsLoading(false);
        return { status: "aborted", finalText: "" };
      }

      const message = err.message || "Stream failed";
      setError(message);
      setIsLoading(false);
      if (isDev) {
        console.warn("[useStreamFetch] Stream failed", err);
      }
      return { status: "error", error: message, finalText: "" };
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
    }
  }, [failStream, isDev, parseSseEventBlock]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStreamedText("");
    setFinalText("");
    setError(null);
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { streamedText, finalText, isLoading, error, startStream, reset };
}
