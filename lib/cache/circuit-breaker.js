import "server-only";

const states = { CLOSED: "closed", HALF_OPEN: "half-open", OPEN: "open" };

function getDefaultConfig() {
  return {
    failureThreshold: Number.parseInt(process.env.CIRCUIT_FAILURE_THRESHOLD ?? "5", 10),
    resetTimeoutMs: Number.parseInt(process.env.CIRCUIT_RESET_TIMEOUT_MS ?? "30000", 10),
    rollingWindowMs: Number.parseInt(process.env.CIRCUIT_ROLLING_WINDOW_MS ?? "60000", 10),
    successThreshold: Number.parseInt(process.env.CIRCUIT_SUCCESS_THRESHOLD ?? "3", 10),
  };
}

export class CircuitBreaker {
  constructor(name, config = {}) {
    this.name = name;
    this.config = { ...getDefaultConfig(), ...config };
    this.state = states.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.lastStateChangeTime = Date.now();
    this.successCount = 0;
  }

  getState() {
    if (this.state === states.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.config.resetTimeoutMs) {
        this.state = states.HALF_OPEN;
        this.lastStateChangeTime = Date.now();
        this.successCount = 0;
      }
    }
    return this.state;
  }

  async execute(operation) {
    const currentState = this.getState();

    if (currentState === states.OPEN) {
      throw new CircuitBreakerOpenError(
        `Circuit breaker "${this.name}" is open. Request rejected.`
      );
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;

    if (this.state === states.HALF_OPEN) {
      this.successCount += 1;
      if (this.successCount >= this.config.successThreshold) {
        this.state = states.CLOSED;
        this.lastStateChangeTime = Date.now();
      }
    }
  }

  onFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.state === states.HALF_OPEN) {
      this.successCount = 0;
      this.state = states.OPEN;
      this.lastStateChangeTime = Date.now();
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.successCount = 0;
      this.state = states.OPEN;
      this.lastStateChangeTime = Date.now();
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      failureThreshold: this.config.failureThreshold,
      successThreshold: this.config.successThreshold,
      lastFailureTime: this.lastFailureTime,
      lastStateChangeTime: this.lastStateChangeTime,
      successCount: this.successCount,
    };
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = "CircuitBreakerOpenError";
  }
}

const breakers = new Map();

export function getCircuitBreaker(name, config) {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, config));
  }
  return breakers.get(name);
}

export function getAllCircuitBreakerStatuses() {
  const statuses = {};
  for (const [name, breaker] of breakers) {
    statuses[name] = breaker.getStatus();
  }
  return statuses;
}
