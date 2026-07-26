/**
 * PII (Personally Identifiable Information) Sanitizer
 * 
 * Redacts sensitive identifiers from text and prompt payloads before sending to AI endpoints.
 * 
 * Supported identifier types:
 * - Email addresses
 * - Phone numbers (US/International/Indian formats)
 * - US Social Security Numbers (SSNs)
 * - Credit card numbers (Visa, Mastercard, Amex, Discover) with Luhn validation
 * - IBANs (International Bank Account Numbers)
 * - Passport numbers (common international formats)
 * 
 * Design principles:
 * - Modular detector architecture for easy extensibility
 * - Validation before redaction to minimize false positives
 * - Precision over broad matching (e.g., Luhn check for credit cards)
 * - No redaction of arbitrary numeric values (ZIP codes, order IDs, etc.)
 * - Performance-optimized with pre-compiled regexes
 */

// ==================== DETECTOR DEFINITIONS ====================

// Email addresses
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Matches US/International/Indian formatted & continuous 10-12 digit phone numbers
// Examples: +91 98765-43210, +919876543210, 98765-43210, (123) 456-7890, 123-456-7890, +1-800-555-0199, 9876543210
// Updated to avoid matching UUID segments by ensuring not preceded by hex-like patterns
const PHONE_REGEX = /(?<![a-f0-9-])(?:\+\d{1,3}[\s.-]*)?(?:\(\d{2,4}\)|\d{2,5})[\s.-]*\d{3,5}[\s.-]+\d{3,5}\b|(?<![a-f0-9-])\b(?:\+\d{1,3})?\d{10,12}\b(?![\d-])/g;

// Matches US Social Security Numbers
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

// Credit card patterns (raw patterns, validated with Luhn before redaction)
// Visa: 13-16 digits, starts with 4
const VISA_PATTERN = /\b4\d{12}(?:\d{3})?\b/g;
// Mastercard: 16 digits, starts with 51-55 or 2221-2720
const MASTERCARD_PATTERN = /\b(?:5[1-5]\d{2}|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)\d{12}\b/g;
// American Express: 15 digits, starts with 34 or 37
const AMEX_PATTERN = /\b3[47]\d{13}\b/g;
// Discover: 16 digits, starts with 6011, 65, 644-649, or 622126-622925
const DISCOVER_PATTERN = /\b(?:6011\d{12}|65\d{14}|6(?:44|5|6|7|8|9)\d{13}|622(?:1[2-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9]|25)\d{10})\b/g;

// Generic PAN (Primary Account Number) pattern: 13-19 digits
// Only used for detection, validated with Luhn before redaction
const GENERIC_PAN_PATTERN = /\b\d{13,19}\b/g;

// IBAN (International Bank Account Number)
// Format: 2-letter country code + 2 check digits + up to 30 alphanumeric characters
// Total length varies by country (15-34 characters)
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi;

// Passport numbers (common international formats)
// Note: Country-specific patterns are avoided to prevent false positives
// These are conservative patterns that match typical passport number formats
// US: 9 digits (may include letter prefix)
const PASSPORT_US_PATTERN = /\b\d{9}\b/g;
// Generic: 1-2 letters followed by 6-9 digits (common in many countries)
const PASSPORT_GENERIC_PATTERN = /\b[A-Za-z]{1,2}\d{6,9}\b/g;

// ==================== VALIDATION HELPERS ====================

/**
 * Luhn algorithm validator for credit card numbers
 * Validates the checksum to reduce false positives
 * @param {string} cardNumber - Numeric string to validate
 * @returns {boolean} True if passes Luhn check
 */
function luhnValidate(cardNumber) {
  if (!/^\d+$/.test(cardNumber)) return false;
  
  let sum = 0;
  let isEven = false;
  
  // Process from right to left
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * IBAN validator using mod-97 checksum
 * @param {string} iban - IBAN string to validate
 * @returns {boolean} True if valid IBAN format and checksum
 */
function ibanValidate(iban) {
  // Basic format check
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/i.test(iban)) return false;
  
  // Move first 4 characters to end
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  
  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  const numeric = rearranged.replace(/[A-Z]/gi, (char) => {
    return (char.toUpperCase().charCodeAt(0) - 55).toString();
  });
  
  // Mod-97 check
  let remainder = BigInt(numeric.slice(0, 9)) % 97n;
  for (let i = 9; i < numeric.length; i += 7) {
    const chunk = remainder.toString() + numeric.slice(i, i + 7);
    remainder = BigInt(chunk) % 97n;
  }
  
  return remainder === 1n;
}

/**
 * Context-aware validator to avoid false positives for passport numbers
 * Checks if the number appears in a context suggesting it's a passport
 * @param {string} text - Full text containing the potential passport number
 * @param {string} match - The matched passport number
 * @returns {boolean} True if likely a passport number
 */
function isLikelyPassport(text, match) {
  const lowerText = text.toLowerCase();
  const passportKeywords = [
    'passport', 'passport no', 'passport number', 'passport #',
    'travel document', 'travel doc', 'citizenship', 'nationality'
  ];
  
  // Check if passport keywords appear near the match
  const matchIndex = text.indexOf(match);
  const contextWindow = 50; // characters before and after
  const start = Math.max(0, matchIndex - contextWindow);
  const end = Math.min(text.length, matchIndex + match.length + contextWindow);
  const context = lowerText.slice(start, end);
  
  return passportKeywords.some(keyword => context.includes(keyword));
}

// ==================== DETECTOR PIPELINE ====================

/**
 * Detector configuration for each identifier type
 * Each detector has: pattern, validator function, and redaction label
 */
const DETECTORS = [
  {
    name: 'email',
    pattern: EMAIL_REGEX,
    validator: null, // No validation needed for email
    label: '[REDACTED EMAIL]'
  },
  {
    name: 'phone',
    pattern: PHONE_REGEX,
    validator: null, // No validation needed for phone
    label: '[REDACTED PHONE]'
  },
  {
    name: 'ssn',
    pattern: SSN_REGEX,
    validator: null, // No validation needed for SSN
    label: '[REDACTED SSN]'
  },
  {
    name: 'credit_card',
    patterns: [VISA_PATTERN, MASTERCARD_PATTERN, AMEX_PATTERN, DISCOVER_PATTERN],
    validator: luhnValidate,
    label: '[REDACTED CREDIT CARD]'
  },
  {
    name: 'iban',
    pattern: IBAN_PATTERN,
    validator: ibanValidate,
    label: '[REDACTED IBAN]'
  },
  {
    name: 'passport',
    patterns: [PASSPORT_US_PATTERN, PASSPORT_GENERIC_PATTERN],
    validator: (match, text) => isLikelyPassport(text, match),
    label: '[REDACTED PASSPORT]'
  }
];

/**
 * Sanitizes a string by replacing PII patterns with redaction placeholder tags.
 * Uses a modular detector pipeline with validation to minimize false positives.
 *
 * @param {string} text - Input text string.
 * @returns {string} Sanitized string with PII masked.
 */
export function sanitizePII(text) {
  if (typeof text !== "string" || !text) return text;

  let result = text;
  
  for (const detector of DETECTORS) {
    if (detector.patterns) {
      // Handle detectors with multiple patterns (e.g., credit cards)
      for (const pattern of detector.patterns) {
        result = result.replace(pattern, (match) => {
          if (detector.validator) {
            // Different validators have different signatures
            // For credit cards, strip non-digits for Luhn validation
            // For IBAN, keep letters for mod-97 validation
            let validationInput = match;
            if (detector.name === 'credit_card') {
              validationInput = match.replace(/\D/g, '');
            }
            
            if (detector.validator.length === 1) {
              // Validator takes only the match (e.g., luhnValidate, ibanValidate)
              if (!detector.validator(validationInput)) return match;
            } else {
              // Validator takes match and full text (e.g., isLikelyPassport)
              if (!detector.validator(validationInput, text)) return match;
            }
          }
          return detector.label;
        });
      }
    } else if (detector.pattern) {
      // Handle detectors with single pattern
      result = result.replace(detector.pattern, (match) => {
        if (detector.validator) {
          if (detector.validator.length === 1) {
            if (!detector.validator(match)) return match;
          } else {
            if (!detector.validator(match, text)) return match;
          }
        }
        return detector.label;
      });
    }
  }
  
  return result;
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
 * Uses the same detector pipeline as sanitizePII for consistency.
 *
 * @param {string} text - Input text string to evaluate.
 * @returns {boolean} True if PII is detected, false otherwise.
 */
export function hasPII(text) {
  if (typeof text !== "string" || !text) return false;
  
  for (const detector of DETECTORS) {
    const patterns = detector.patterns || [detector.pattern];
    if (!patterns[0]) continue;
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        // Check if any match passes validation
        for (const match of matches) {
          if (!detector.validator) return true;
          
          let validationInput = match;
          if (detector.name === 'credit_card') {
            validationInput = match.replace(/\D/g, '');
          }
          
          if (detector.validator.length === 1) {
            if (detector.validator(validationInput)) return true;
          } else {
            if (detector.validator(validationInput, text)) return true;
          }
        }
      }
    }
  }
  
  return false;
}
