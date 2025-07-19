/**
 * JWT utility functions for authentication
 * Handles token signing and verification
 */

import jwt from 'jsonwebtoken';

// Secret key for JWT signing/verification - should be in env vars
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-variables';

// Token expiration (23h to allow for refresh before 24h)
const TOKEN_EXPIRATION = '23h';

/**
 * Generate a JWT token with user data
 * @param {Object} payload - Data to include in token (typically user ID and role)
 * @returns {Promise<string>} Signed JWT token
 */
export async function generateJWT(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: TOKEN_EXPIRATION
    });
  } catch (error) {
    console.error('JWT signing error:', error);
    throw new Error('Failed to sign JWT');
  }
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object|null>} Decoded token payload or null if invalid
 */
export async function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Check if a token is valid (not expired and has required fields)
 * @param {Object} decodedToken - Decoded JWT token
 * @returns {boolean} Whether token is valid
 */
export function isTokenValid(decodedToken) {
  if (!decodedToken) return false;
  
  const currentTime = Math.floor(Date.now() / 1000);
  
  return (
    decodedToken.exp &&
    decodedToken.exp > currentTime &&
    decodedToken.id // User ID should be in the 'id' field
  );
} 