const ANONYMOUS_OWNER = "anonymous";

export function getShortlistOwnerId(userId) {
  return userId || ANONYMOUS_OWNER;
}

export function isCareerShortlistEntry(career) {
  return Boolean(career && typeof career === "object" && career.id && career.title);
}

export function stripPersistedPersonalization(career) {
  return {
    ...career,
    matchScore: null,
    personalizedScore: null,
    matchedSkills: [],
    missingSkills: career.skills || career.missingSkills || [],
    isPersonalized: false,
  };
}

/**
 * Load shortlist for the active owner. Legacy unscoped arrays are not trusted
 * across accounts — signed-in users get a fresh list; anonymous legacy items
 * keep career IDs but drop personalized match scores.
 *
 * Returns `null` when the stored payload is unrecognized garbage (caller may
 * safely discard it), `[]` when there is nothing for this owner but the stored
 * payload belongs to another owner (caller must preserve it), and the item
 * array otherwise.
 */
export function readShortlistForOwner(raw, ownerId) {
  if (!raw) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
    if (parsed.ownerId !== ownerId) {
      return [];
    }
    return parsed.items.filter(isCareerShortlistEntry);
  }

  if (Array.isArray(parsed) && parsed.every(isCareerShortlistEntry)) {
    if (ownerId !== ANONYMOUS_OWNER) {
      return [];
    }
    return parsed.map(stripPersistedPersonalization);
  }

  return null;
}

export function writeShortlistPayload(ownerId, items) {
  return JSON.stringify({ ownerId, items });
}

export { ANONYMOUS_OWNER };
