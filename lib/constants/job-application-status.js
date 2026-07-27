/**
 * Job Application Status Constants
 *
 * Canonical statuses represent values stored in the database:
 * - INTERVIEWING ("Interviewing") is the canonical database status for interview stage applications.
 * - INTERVIEW ("Interview") is a display/analytics label alias.
 * - OFFER_RECEIVED ("Offer Received") is a canonical status, OFFER ("Offer") is a display label.
 * - SAVED ("Saved") is a canonical status, WISHLIST ("Wishlist") is a display/legacy alias.
 */

export const JOB_APPLICATION_STATUS = Object.freeze({
  SAVED: "Saved",
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  ONLINE_ASSESSMENT: "Online Assessment (OA)",
  INTERVIEWING: "Interviewing",
  INTERVIEW: "Interview",
  OFFER_RECEIVED: "Offer Received",
  OFFER: "Offer",
  REJECTED: "Rejected",
});

/**
 * List of canonical job application statuses persisted in the database.
 */
export const CANONICAL_JOB_STATUSES = Object.freeze([
  JOB_APPLICATION_STATUS.SAVED,
  JOB_APPLICATION_STATUS.APPLIED,
  JOB_APPLICATION_STATUS.ONLINE_ASSESSMENT,
  JOB_APPLICATION_STATUS.INTERVIEWING,
  JOB_APPLICATION_STATUS.OFFER_RECEIVED,
  JOB_APPLICATION_STATUS.REJECTED,
]);

/**
 * Display/Form job statuses used for UI selection and Kanban board defaults.
 */
export const DISPLAY_JOB_STATUSES = Object.freeze([
  JOB_APPLICATION_STATUS.SAVED,
  JOB_APPLICATION_STATUS.APPLIED,
  JOB_APPLICATION_STATUS.ONLINE_ASSESSMENT,
  JOB_APPLICATION_STATUS.INTERVIEW,
  JOB_APPLICATION_STATUS.REJECTED,
  JOB_APPLICATION_STATUS.OFFER,
]);
