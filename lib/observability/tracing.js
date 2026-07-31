import crypto from "node:crypto";

let tracerInitialized = false;

function generateId() {
  return crypto.randomUUID();
}

function getTraceContext() {
  const headers = typeof globalThis !== "undefined" ? globalThis : {};

  if (typeof headers.request?.headers === "object") {
    return {
      traceId: headers.request.headers.get("x-trace-id") ?? generateId(),
      parentSpanId: headers.request.headers.get("x-span-id") ?? null,
    };
  }

  return {
    traceId: generateId(),
    parentSpanId: null,
  };
}

export class Span {
  constructor(name, parentSpanId = null) {
    this.name = name;
    this.spanId = generateId();
    this.parentSpanId = parentSpanId;
    this.startTime = performance.now();
    this.endTime = null;
    this.attributes = {};
    this.events = [];
  }

  setAttribute(key, value) {
    this.attributes[key] = value;
    return this;
  }

  addEvent(name, data = {}) {
    this.events.push({ name, data, timestamp: Date.now() });
    return this;
  }

  end() {
    this.endTime = performance.now();
    this.durationMs = this.endTime - this.startTime;
    return this;
  }

  toJSON() {
    return {
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      startTime: this.startTime,
      durationMs: this.durationMs ?? 0,
      attributes: this.attributes,
      events: this.events,
    };
  }
}

export function createTraceContext(traceId = null, parentSpanId = null) {
  return {
    traceId: traceId ?? generateId(),
    parentSpanId: parentSpanId ?? null,
  };
}

export function startSpan(name, parentSpanId = null) {
  return new Span(name, parentSpanId);
}

export function traceMiddleware(traces = []) {
  return {
    addTrace(trace) {
      traces.push(trace);
    },
    getTraces() {
      return traces;
    },
    getTraceById(traceId) {
      return traces.find((t) => t.traceId === traceId);
    },
  };
}

const tracing = { createTraceContext, startSpan, Span, traceMiddleware };

export default tracing;
