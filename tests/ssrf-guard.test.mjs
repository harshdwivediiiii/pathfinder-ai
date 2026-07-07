import { describe, it, expect, vi } from "vitest";
import { safeFetch } from "../lib/safe-fetch.js";
import dns from "dns/promises";

// Mock the DNS module to simulate restricted IPs
vi.mock("dns/promises", () => ({
  default: {
    lookup: vi.fn(),
  },
}));

describe("SSRF Guard Security Tests", () => {
  it("blocks requests to internal metadata IP (169.254.169.254)", async () => {
    // Simulate DNS resolving to the restricted AWS metadata IP
    dns.lookup.mockResolvedValue([{ address: "169.254.169.254" }]);

    const result = await safeFetch("http://internal.service");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toMatch(/restricted internal network/i);
  });

  it("blocks requests to loopback address (127.0.0.1)", async () => {
    dns.lookup.mockResolvedValue([{ address: "127.0.0.1" }]);

    const result = await safeFetch("http://localhost:8080");

    expect(result.success).toBe(false);
    expect(result.errors._form[0]).toMatch(/restricted internal network/i);
  });

  it("allows requests to public IPs", async () => {
    dns.lookup.mockResolvedValue([{ address: "93.184.216.34" }]);

    // Robust mock implementation
    const fetchMock = vi.fn().mockImplementation(async (url, options) => {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html", "content-length": "20" }),
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode("<html>Public content</html>") })
              .mockResolvedValueOnce({ done: true }),
            cancel: vi.fn(),
          }),
        },
      };
    });
    
    vi.stubGlobal("fetch", fetchMock);

    const result = await safeFetch("https://example.com");

    if (!result.success) {
      console.log("DEBUG_ERRORS:", result.errors); // Still useful if it fails again
    }

    expect(result.success).toBe(true);
    expect(result.text).toBe("<html>Public content</html>");
  });
});