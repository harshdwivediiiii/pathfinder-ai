import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

/**
 * Merge class names with tailwind-merge support.
 * @param {...any} inputs - Class names to merge
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
