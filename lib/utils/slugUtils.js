/**
 * Utility functions for generating and handling URL-friendly slugs
 */

/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - The title to convert to slug
 * @returns {string} - URL-friendly slug
 */
export function generateSlug(title) {
  if (!title || typeof title !== 'string') {
    return '';
  }

  return title
    .toLowerCase()
    .trim()
    // Remove special characters except letters, numbers, spaces, and hyphens
    .replace(/[^\w\s-]/g, '')
    // Replace spaces and multiple spaces with single hyphen
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to 100 characters
    .substring(0, 100)
    // Remove trailing hyphen if it was cut off
    .replace(/-+$/, '');
}

/**
 * Generate a unique slug by checking against existing slugs
 * @param {string} title - The title to convert to slug
 * @param {Function} checkExists - Function that returns true if slug exists
 * @returns {Promise<string>} - Unique URL-friendly slug
 */
export async function generateUniqueSlug(title, checkExists) {
  const baseSlug = generateSlug(title);
  
  if (!baseSlug) {
    // Fallback for empty slugs
    return `post-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 0;

  // Check if slug exists and increment counter until unique
  while (await checkExists(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/**
 * Validate if a string is a valid slug format
 * @param {string} slug - The slug to validate
 * @returns {boolean} - True if valid slug format
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Check if slug matches expected format: lowercase letters, numbers, hyphens
  // No leading/trailing hyphens, no consecutive hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 100;
}

/**
 * Clean and normalize a slug
 * @param {string} slug - The slug to clean
 * @returns {string} - Cleaned slug
 */
export function cleanSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
    .replace(/-+$/, '');
}

/**
 * Convert slug back to a readable title (for display purposes)
 * @param {string} slug - The slug to convert
 * @returns {string} - Human-readable title
 */
export function slugToTitle(slug) {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
