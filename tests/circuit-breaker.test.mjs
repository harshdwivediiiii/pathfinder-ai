import { describe, it, expect, beforeEach } from "vitest";
import { CircuitBreaker, CircuitBreakerOpenError } from "@/lib/cache/circuit-breaker";

describe("CircuitBreaker", () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker("test-service", {
      failureThreshold: 2,
      resetTimeoutMs: 100,
      rollingWindowMs: 1000,
    });
  });

  it("starts in closed state", () => {
    expect(breaker.getState()).toBe("closed");
  });

  it("transitions to open after reaching failure threshold", () => {
    breaker.onFailure();
    breaker.onFailure();
    expect(breaker.getState()).toBe("open");
  });

  it("transitions to half-open after reset timeout", async () => {
    breaker.onFailure();
    breaker.onFailure();
    expect(breaker.getState()).toBe("open");

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(breaker.getState()).toBe("half-open");
  });

  it("closes after a successful call in half-open state", async () => {
    breaker.onFailure();
    breaker.onFailure();
    expect(breaker.getState()).toBe("open");

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(breaker.getState()).toBe("half-open");

    breaker.onSuccess();
    expect(breaker.getState()).toBe("closed");
  });

  it("throws CircuitBreakerOpenError when open", async () => {
    breaker.onFailure();
    breaker.onFailure();

    const operation = () => Promise.resolve("success");
    await expect(breaker.execute(operation)).rejects.toThrow(CircuitBreakerOpenError);
  });

  it("resets failure count on success in closed state", () => {
    breaker.onFailure();
    expect(breaker.failureCount).toBe(1);

    breaker.onSuccess();
    expect(breaker.failureCount).toBe(0);
  });

  it("returns correct status object", () => {
    breaker.onFailure();
    breaker.onFailure();

    const status = breaker.getStatus();
    expect(status.name).toBe("test-service");
    expect(status.state).toBe("open");
    expect(status.failureCount).toBe(2);
    expect(status.failureThreshold).toBe(2);
  });

  it("executes operation successfully in closed state", async () => {
    const result = await breaker.execute(() => Promise.resolve("result"));
    expect(result).toBe("result");
    expect(breaker.getState()).toBe("closed");
  });

  it("tracks failure count on operation failure", async () => {
    try {
      await breaker.execute(() => Promise.reject(new Error("fail")));
    } catch {
    }
    expect(breaker.failureCount).toBe(1);
  });

  it("does not open on single failure below threshold", () => {
    breaker.onFailure();
    expect(breaker.getState()).toBe("closed");
  });
});