import { describe, it, expect } from "vitest";
import { sanitizePII, sanitizePIIPayload, hasPII } from "../lib/utils/sanitizePII.js";

describe("PII Sanitizer Utility", () => {
  describe("sanitizePII - Existing Behavior", () => {
    it("should mask email addresses with [REDACTED EMAIL]", () => {
      const input = "Please reach out to john.doe@example.com or jane_doe123@domain.co.in.";
      const output = sanitizePII(input);
      expect(output).toBe("Please reach out to [REDACTED EMAIL] or [REDACTED EMAIL].");
    });

    it("should mask phone numbers in various formats with [REDACTED PHONE]", () => {
      const input1 = "Call me at +91 98765-43210 immediately.";
      const input2 = "Reach us at (123) 456-7890 or 123-456-7890.";
      const input3 = "Direct line: 9876543210.";

      expect(sanitizePII(input1)).toBe("Call me at [REDACTED PHONE] immediately.");
      expect(sanitizePII(input2)).toBe("Reach us at [REDACTED PHONE] or [REDACTED PHONE].");
      expect(sanitizePII(input3)).toBe("Direct line: [REDACTED PHONE].");
    });

    it("should mask US Social Security Numbers with [REDACTED SSN]", () => {
      const input = "SSN: 123-45-6789 confidential.";
      expect(sanitizePII(input)).toBe("SSN: [REDACTED SSN] confidential.");
    });

    it("should redact multiple PII types in a single string", () => {
      const input =
        "Contact john@example.com or call +91 9876543210. SSN: 123-45-6789.";

      expect(sanitizePII(input)).toBe(
        "Contact [REDACTED EMAIL] or call +91 [REDACTED PHONE]. SSN: [REDACTED SSN]."
      );
    });
  });

  describe("sanitizePII - Credit Card Detection", () => {
    it("should mask valid Visa card numbers with Luhn validation", () => {
      // Valid Visa: 4111111111111111 (passes Luhn)
      const input = "Card: 4111111111111111";
      expect(sanitizePII(input)).toBe("Card: [REDACTED CREDIT CARD]");
    });

    it("should mask valid Mastercard numbers with Luhn validation", () => {
      // Valid Mastercard: 5555555555554444 (passes Luhn)
      const input = "Card: 5555555555554444";
      expect(sanitizePII(input)).toBe("Card: [REDACTED CREDIT CARD]");
    });

    it("should mask valid American Express numbers with Luhn validation", () => {
      // Valid Amex: 378282246310005 (passes Luhn)
      const input = "Card: 378282246310005";
      expect(sanitizePII(input)).toBe("Card: [REDACTED CREDIT CARD]");
    });

    it("should mask valid Discover numbers with Luhn validation", () => {
      // Valid Discover: 6011111111111117 (passes Luhn)
      const input = "Card: 6011111111111117";
      expect(sanitizePII(input)).toBe("Card: [REDACTED CREDIT CARD]");
    });

    it("should NOT redact invalid card numbers that fail Luhn check", () => {
      // Invalid: 4111111111111112 (fails Luhn)
      const input = "Card: 4111111111111112";
      expect(sanitizePII(input)).toBe("Card: 4111111111111112");
    });
  });

  describe("sanitizePII - IBAN Detection", () => {
    it("should mask valid IBANs with mod-97 validation", () => {
      // Valid German IBAN: DE89370400440532013000
      const input = "IBAN: DE89370400440532013000";
      expect(sanitizePII(input)).toBe("IBAN: [REDACTED IBAN]");
    });

    it("should mask valid IBANs in lowercase", () => {
      const input = "IBAN: de89370400440532013000";
      expect(sanitizePII(input)).toBe("IBAN: [REDACTED IBAN]");
    });

    it("should NOT redact invalid IBANs that fail mod-97 check", () => {
      // Invalid IBAN (wrong checksum)
      const input = "IBAN: DE89370400440532013001";
      expect(sanitizePII(input)).toBe("IBAN: DE89370400440532013001");
    });

    it("should handle different IBAN formats", () => {
      // Valid French IBAN: FR1420041010050500013M02606
      const input = "IBAN: FR1420041010050500013M02606";
      expect(sanitizePII(input)).toBe("IBAN: [REDACTED IBAN]");
    });
  });

  describe("sanitizePII - Passport Detection", () => {
    it("should mask passport numbers with context keywords", () => {
      const input = "Passport number: 123456789";
      expect(sanitizePII(input)).toBe("Passport number: [REDACTED PASSPORT]");
    });

    it("should mask passport numbers with letter prefix and context", () => {
      const input = "Passport: A1234567 for travel";
      expect(sanitizePII(input)).toBe("Passport: [REDACTED PASSPORT] for travel");
    });

    it("should NOT redact numeric values without passport context", () => {
      const input = "Order number: 123456789";
      expect(sanitizePII(input)).toBe("Order number: 123456789");
    });

    it("should detect passport with travel document keyword", () => {
      const input = "Travel document: AB1234567";
      expect(sanitizePII(input)).toBe("Travel document: [REDACTED PASSPORT]");
    });
  });

  describe("sanitizePII - Negative Cases (False Positive Prevention)", () => {
    it("should preserve non-PII technical text, years, and metrics", () => {
      const input = "In 2026, improved performance by 100% using React 19 and Node 22. Zip code 90210.";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should NOT redact ZIP codes", () => {
      const input = "Zip code: 90210, 12345";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should NOT redact order IDs", () => {
      const input = "Order ID: ORD-12345, INV-67890";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should NOT redact invoice numbers", () => {
      const input = "Invoice: INV-2024-001";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should NOT redact product IDs", () => {
      const input = "Product ID: SKU-12345";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should NOT redact timestamps", () => {
      const input = "Timestamp: 1704067200000";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should NOT redact version numbers", () => {
      const input = "Version 1.2.3, 2.0.0";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should NOT redact random numeric strings", () => {
      const input = "Random: 123456789012345";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should NOT redact UUIDs", () => {
      const input = "UUID: 550e8400-e29b-41d4-a716-446655440000";
      expect(sanitizePII(input)).toBe(input);
    });

    it("should handle empty or non-string inputs safely", () => {
      expect(sanitizePII("")).toBe("");
      expect(sanitizePII(null)).toBe(null);
      expect(sanitizePII(undefined)).toBe(undefined);
    });
  });

  describe("sanitizePIIPayload - Extended Tests", () => {
    it("should recursively sanitize string fields in an object payload", () => {
      const payload = {
        companyName: "Acme Corp",
        jobTitle: "Software Engineer",
        jobDescription: "Apply at candidate@example.com or call 9876543210 for details.",
        metadata: {
          contact: "reach test@domain.com",
        },
      };

      const sanitized = sanitizePIIPayload(payload);

      expect(sanitized.companyName).toBe("Acme Corp");
      expect(sanitized.jobTitle).toBe("Software Engineer");
      expect(sanitized.jobDescription).toBe("Apply at [REDACTED EMAIL] or call [REDACTED PHONE] for details.");
      expect(sanitized.metadata.contact).toBe("reach [REDACTED EMAIL]");
    });

    it("should sanitize arrays recursively", () => {
      const payload = [
        "Email john@example.com",
        {
          phone: "9876543210",
        },
      ];

      const sanitized = sanitizePIIPayload(payload);

      expect(sanitized[0]).toBe("Email [REDACTED EMAIL]");
      expect(sanitized[1].phone).toBe("[REDACTED PHONE]");
    });

    it("should sanitize deeply nested payloads", () => {
      const payload = {
        level1: {
          level2: {
            level3: {
              contact: "john@example.com",
            },
          },
        },
      };

      const sanitized = sanitizePIIPayload(payload);

      expect(sanitized.level1.level2.level3.contact).toBe(
        "[REDACTED EMAIL]"
      );
    });

    it("should sanitize credit cards in payloads", () => {
      const payload = {
        payment: {
          card: "4111111111111111",
        },
      };

      const sanitized = sanitizePIIPayload(payload);
      expect(sanitized.payment.card).toBe("[REDACTED CREDIT CARD]");
    });

    it("should sanitize IBANs in payloads", () => {
      const payload = {
        bank: {
          iban: "DE89370400440532013000",
        },
      };

      const sanitized = sanitizePIIPayload(payload);
      expect(sanitized.bank.iban).toBe("[REDACTED IBAN]");
    });

    it("should sanitize passport numbers in payloads with context", () => {
      const payload = {
        travel: {
          document: "Passport: 123456789",
        },
      };

      const sanitized = sanitizePIIPayload(payload);
      expect(sanitized.travel.document).toBe("Passport: [REDACTED PASSPORT]");
    });

    it("should not mutate original payload", () => {
      const payload = {
        email: "test@example.com",
        nested: {
          phone: "9876543210",
        },
      };

      const originalEmail = payload.email;
      const originalPhone = payload.nested.phone;

      sanitizePIIPayload(payload);

      expect(payload.email).toBe(originalEmail);
      expect(payload.nested.phone).toBe(originalPhone);
    });

    it("should handle mixed object structures", () => {
      const payload = {
        string: "test@example.com",
        number: 12345,
        boolean: true,
        null: null,
        array: ["email@test.com", 123],
        nested: {
          card: "4111111111111111",
        },
      };

      const sanitized = sanitizePIIPayload(payload);

      expect(sanitized.string).toBe("[REDACTED EMAIL]");
      expect(sanitized.number).toBe(12345);
      expect(sanitized.boolean).toBe(true);
      expect(sanitized.null).toBe(null);
      expect(sanitized.array[0]).toBe("[REDACTED EMAIL]");
      expect(sanitized.array[1]).toBe(123);
      expect(sanitized.nested.card).toBe("[REDACTED CREDIT CARD]");
    });
  });

  describe("hasPII - Extended Detection", () => {
    it("should return true if email or phone is present", () => {
      expect(hasPII("My email is test@domain.com")).toBe(true);
      expect(hasPII("Call +91 98765-43210")).toBe(true);
      expect(hasPII("SSN 123-45-6789")).toBe(true);
    });

    it("should detect valid credit cards", () => {
      expect(hasPII("Card: 4111111111111111")).toBe(true);
      expect(hasPII("Card: 5555555555554444")).toBe(true);
      expect(hasPII("Card: 378282246310005")).toBe(true);
    });

    it("should NOT detect invalid credit cards", () => {
      expect(hasPII("Card: 4111111111111112")).toBe(false);
    });

    it("should detect valid IBANs", () => {
      expect(hasPII("IBAN: DE89370400440532013000")).toBe(true);
      expect(hasPII("IBAN: FR1420041010050500013M02606")).toBe(true);
    });

    it("should NOT detect invalid IBANs", () => {
      expect(hasPII("IBAN: DE89370400440532013001")).toBe(false);
    });

    it("should detect passport numbers with context", () => {
      expect(hasPII("Passport: 123456789")).toBe(true);
      expect(hasPII("Travel document: AB1234567")).toBe(true);
    });

    it("should NOT detect numbers without passport context", () => {
      expect(hasPII("Order: 123456789")).toBe(false);
    });

    it("should return false if no PII is present", () => {
      expect(hasPII("Experienced Full Stack Developer with 5 years experience.")).toBe(false);
      expect(hasPII("")).toBe(false);
    });

    it("should return false for invalid inputs", () => {
      expect(hasPII(null)).toBe(false);
      expect(hasPII(undefined)).toBe(false);
      expect(hasPII(12345)).toBe(false);
      expect(hasPII({})).toBe(false);
      expect(hasPII([])).toBe(false);
    });
  });
});
