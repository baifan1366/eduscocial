/**
 * Helper functions for authentication
 */

/**
 * Checks if an email is from an educational institution
 * @param {string} email - The email to check
 * @returns {boolean} True if the email is from an educational institution
 */
export function isEducationalEmail(email) {
  if (!email) return false;
  
  // List of common educational domains
  const educationalDomains = [
    '.edu',
    '.edu.',
    '.ac.',
    'university',
    'school',
    'college',
    'academy'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return educationalDomains.some(eduDomain => domain.includes(eduDomain));
}

/**
 * Get user info from session
 * @param {object} session - The NextAuth session object
 * @returns {object} User info
 */
export function getUserFromSession(session) {
  return session?.user || null;
}

/**
 * Check if the current user has admin role
 * @param {object} session - The NextAuth session object
 * @returns {boolean} True if user has admin role
 */
export function isAdmin(session) {
  return session?.user?.role === 'ADMIN';
}

/**
 * Check if the current user has moderator role
 * @param {object} session - The NextAuth session object
 * @returns {boolean} True if user has moderator role
 */
export function isModerator(session) {
  return session?.user?.role === 'MODERATOR' || isAdmin(session);
} 