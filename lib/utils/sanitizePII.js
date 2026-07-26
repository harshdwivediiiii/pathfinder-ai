/**
 * PII (Personally Identifiable Information) Sanitizer
 * Redacts email addresses, phone numbers, SSNs, credit card numbers,
 * IBANs, passport numbers, and driver's license numbers from text and
 * prompt payloads before sending to AI endpoints.
 */

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Matches US/International/Indian formatted & continuous 10-12 digit phone numbers
// Examples: +91 98765-43210, +919876543210, 98765-43210, (123) 456-7890, 123-456-7890, +1-800-555-0199, 9876543210
const PHONE_REGEX = /(?:\+\d{1,3}[\s.-]*)?(?:\(\d{2,4}\)|\d{2,5})[\s.-]*\d{3,5}[\s.-]+\d{3,5}\b|\b(?:\+\d{1,3})?\d{10,12}\b/g;

// Matches US Social Security Numbers
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

// Matches credit and debit card numbers (Visa, Mastercard, Amex, Discover, JCB, UnionPay)
// with optional spaces or dashes; 13-19 digits total.
const CARD_REGEX = /\b(?:4[0-9]{3}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}|5[1-5]\d{2}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}|2[2-7]\d{2}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}|3[47]\d{2}[\s.-]?\d{6}[\s.-]?\d{5}|6(?:011|5\d{2})[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}|3(?:0[0-5]|[68]\d)\d[\s.-]?\d{6}[\s.-]?\d{4}|(?:\d[ -]*?){13,19})\b(?<!\d[ -])\b/g;

// Matches International Bank Account Numbers (IBAN) — up to 34 alphanumeric chars, 2-letter country code + 2 check digits
const IBAN_REGEX = /\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/g;

// Matches common passport number formats:
// US: 1 letter + 8 digits
// UK: 9 digits
// EU (sample): 2 letters + 7 digits, or 1 letter + 6 digits, or 9 alphanumeric
const PASSPORT_REGEX = /\b(?:[A-Z]\d{8}|(?:GB|EP|PA|PF)\d{7}|\d{9}|[A-Z]{1,2}\d{6,7}|[A-Z]{2}\d{7})\b/g;

// Matches common US state driver's license formats: 1-2 letters followed by 6-10 digits/letters
const DRIVER_LICENSE_REGEX = /\b[A-Z]{1,2}\d{6,10}\b/g;

/**
 * Sanitizes a string by replacing PII patterns with redaction placeholder tags.
 *
 * @param {string} text - Input text string.
 * @returns {string} Sanitized string with PII masked.
 */
export function sanitizePII(text) {
  if (typeof text !== "string" || !text) return text;

  return text
    .replace(EMAIL_REGEX, "[REDACTED EMAIL]")
    .replace(SSN_REGEX, "[REDACTED SSN]")
    .replace(PHONE_REGEX, "[REDACTED PHONE]")
    .replace(CARD_REGEX, "[REDACTED CARD]")
    .replace(IBAN_REGEX, "[REDACTED IBAN]")
    .replace(PASSPORT_REGEX, "[REDACTED PASSPORT]")
    .replace(DRIVER_LICENSE_REGEX, "[REDACTED DRIVER LICENSE]");
}

/**
 * Recursively sanitizes string values in an object or array payload.
 *
 * @param {object|array|string} payload - Target payload object/array to sanitize.
 * @returns {object|array|string} Payload copy with sanitized text fields.
 */
export function sanitizePIIPayload(payload) {
  if (!payload || typeof payload !== "object") {
    if (typeof payload === "string") return sanitizePII(payload);
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePIIPayload(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizePII(value);
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizePIIPayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Checks whether a given string contains any recognizable PII patterns.
 *
 * @param {string} text - Input text string to evaluate.
 * @returns {boolean} True if PII is detected, false otherwise.
 */
export function hasPII(text) {
  if (typeof text !== "string" || !text) return false;
  const emailPattern = new RegExp(EMAIL_REGEX.source, "i");
  const phonePattern = new RegExp(PHONE_REGEX.source, "i");
  const ssnPattern = new RegExp(SSN_REGEX.source, "i");
  const cardPattern = new RegExp(CARD_REGEX.source, "i");
  const ibanPattern = new RegExp(IBAN_REGEX.source, "i");
  const passportPattern = new RegExp(PASSPORT_REGEX.source, "i");
  const dlPattern = new RegExp(DRIVER_LICENSE_REGEX.source, "i");
  return (
    emailPattern.test(text) ||
    phonePattern.test(text) ||
    ssnPattern.test(text) ||
    cardPattern.test(text) ||
    ibanPattern.test(text) ||
    passportPattern.test(text) ||
    dlPattern.test(text)
  );
}
