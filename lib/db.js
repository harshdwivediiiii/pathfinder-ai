/**
 * @file db.js
 * @description Database access interface. Marked with "server-only" to prevent accidental inclusion in client bundles.
 */
import "server-only";

export { db } from "./prisma";
