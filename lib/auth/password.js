/**
 * Password utility functions
 * Handles hashing and verification using bcrypt
 */

import bcrypt from 'bcrypt';

/**
 * Hash a password using bcrypt
 * 
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with a hash
 * 
 * @param {string} password - Plain text password to check
 * @param {string} hash - Hashed password from database
 * @returns {Promise<boolean>} Whether password matches hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random password
 * 
 * @param {number} length - Length of password
 * @returns {string} Random password
 */
export function generateRandomPassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid flag and message
 */
export function validatePasswordStrength(password) {
  // Password must be at least 8 characters long
  if (!password || password.length < 8) {
    return { 
      isValid: false, 
      message: 'Password must be at least 8 characters long' 
    };
  }

  // Password should contain at least one digit
  if (!/\d/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one digit' 
    };
  }

  // Password should contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter' 
    };
  }

  // Password should contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one lowercase letter' 
    };
  }

  // Password should contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one special character' 
    };
  }

  // Password is valid
  return { isValid: true, message: 'Password is strong' };
} 