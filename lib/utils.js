import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Extract common query parameters from URLSearchParams
 * @param {URLSearchParams} params - The URL search params object
 * @returns {object} Extracted parameters with defaults
 */
export function getQueryParams(params) {
  return {
    showSettings: params.get('settings') === 'true',
    activeTab: params.get('tab') || 'general',
    callbackUrl: params.get('callbackUrl') || '/',
  };
}
