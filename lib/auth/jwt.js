/**
 * JWT utility functions for authentication
 * Handles token signing and verification using Web Crypto API for Edge Runtime compatibility
 * Enhanced with blacklist integration for immediate token revocation
 */

import { isTokenBlacklisted } from "./tokenBlacklist.js";

// Secret key for JWT signing/verification - should be in env vars
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-should-be-in-env-variables";

// Token expiration in seconds (23 hours)
const TOKEN_EXPIRATION = 23 * 60 * 60; // 23 hours in seconds

/**
 * Base64 URL encode - compatible with Edge Runtime
 */
function base64UrlEncode(str) {
  // Convert string to base64
  let base64;
  if (typeof btoa !== "undefined") {
    base64 = btoa(str);
  } else if (typeof Buffer !== "undefined") {
    // Fallback for Node.js environments
    base64 = Buffer.from(str, "utf8").toString("base64");
  } else {
    // Manual base64 encoding for Edge Runtime
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    let i = 0;

    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : "=";
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : "=";
    }

    base64 = result;
  }

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Base64 URL decode - compatible with Edge Runtime
 */
function base64UrlDecode(str) {
  // Replace URL-safe characters
  let base64 = str.replace(/\-/g, "+").replace(/_/g, "/");

  // Add proper padding
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }

  try {
    if (typeof atob !== "undefined") {
      return atob(base64);
    } else if (typeof Buffer !== "undefined") {
      // Fallback for Node.js environments
      return Buffer.from(base64, "base64").toString("utf8");
    } else {
      // Manual base64 decoding for Edge Runtime
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let result = "";
      let i = 0;

      while (i < base64.length) {
        const encoded1 = chars.indexOf(base64.charAt(i++));
        const encoded2 = chars.indexOf(base64.charAt(i++));
        const encoded3 = chars.indexOf(base64.charAt(i++));
        const encoded4 = chars.indexOf(base64.charAt(i++));

        const bitmap =
          (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

        result += String.fromCharCode((bitmap >> 16) & 255);
        if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
        if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
      }

      return result;
    }
  } catch (error) {
    console.error("Base64 decode error:", error);
    throw new Error("Invalid base64 string");
  }
}

/**
 * Generate HMAC signature using Web Crypto API
 */
async function generateSignature(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verify HMAC signature using Web Crypto API
 */
async function verifySignature(data, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  try {
    // Convert base64url signature to base64
    let base64 = signature.replace(/-/g, "+").replace(/_/g, "/");

    // Add proper padding
    const padding = base64.length % 4;
    if (padding) {
      base64 += "=".repeat(4 - padding);
    }

    let signatureBytes;

    if (typeof atob !== "undefined") {
      const binaryString = atob(base64);
      signatureBytes = new Uint8Array(
        binaryString.split("").map((char) => char.charCodeAt(0))
      );
    } else if (typeof Buffer !== "undefined") {
      // Fallback for Node.js environments
      signatureBytes = new Uint8Array(Buffer.from(base64, "base64"));
    } else {
      // Manual base64 decoding for Edge Runtime
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      const bytes = [];
      let i = 0;

      while (i < base64.length) {
        const encoded1 = chars.indexOf(base64.charAt(i++));
        const encoded2 = chars.indexOf(base64.charAt(i++));
        const encoded3 = chars.indexOf(base64.charAt(i++));
        const encoded4 = chars.indexOf(base64.charAt(i++));

        const bitmap =
          (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

        bytes.push((bitmap >> 16) & 255);
        if (encoded3 !== 64) bytes.push((bitmap >> 8) & 255);
        if (encoded4 !== 64) bytes.push(bitmap & 255);
      }

      signatureBytes = new Uint8Array(bytes);
    }

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(data)
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Generate a JWT token with user data
 * @param {Object} payload - Data to include in token (typically user ID and role)
 * @returns {Promise<string>} Signed JWT token
 */
export async function generateJWT(payload) {
  try {
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + TOKEN_EXPIRATION,
<<<<<<< HEAD
=======
      role: payload.role || 'user'
>>>>>>> 1a55df7143f50beea384adaa2a06cefc0144e2c3
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
    const data = `${encodedHeader}.${encodedPayload}`;

    const signature = await generateSignature(data, JWT_SECRET);

    return `${data}.${signature}`;
  } catch (error) {
    console.error("JWT signing error:", error);
    throw new Error("Failed to sign JWT");
  }
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object|null>} Decoded token payload or null if invalid
 */
export async function verifyJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const isValid = await verifySignature(data, signature, JWT_SECRET);
    if (!isValid) {
      throw new Error("Invalid signature");
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error("Token expired");
    }

    return payload;
  } catch (error) {
    console.error("JWT verification error:", error.message);
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
    decodedToken.exp && decodedToken.exp > currentTime && decodedToken.id // User ID should be in the 'id' field
  );
}

/**
 * Extract token signature for blacklist storage
 * Uses last 32 characters of signature for uniqueness while minimizing storage
 * @param {string} token - JWT token
 * @returns {string} Token signature for blacklist storage
 * @throws {Error} If token format is invalid
 */
export function getTokenSignature(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token: token must be a non-empty string");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format: JWT must have 3 parts");
  }

  const signature = parts[2];
  if (!signature || signature.length < 32) {
    throw new Error("Invalid token signature: signature too short");
  }

  // Use last 32 characters of signature for uniqueness
  return signature.slice(-32);
}

/**
 * Extract token metadata without full verification
 * Useful for getting token information before blacklist checking
 * @param {string} token - JWT token
 * @returns {Object|null} Token metadata or null if invalid format
 */
export function getTokenMetadata(token) {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Decode header and payload
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    return {
      header,
      payload,
      signature: signature.slice(-8), // Last 8 chars for identification
      isExpired: payload.exp
        ? payload.exp < Math.floor(Date.now() / 1000)
        : false,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
      userId: payload.id || payload.sub || null,
      remainingTime: payload.exp
        ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
        : 0,
    };
  } catch (error) {
    console.error("Error extracting token metadata:", error);
    return null;
  }
}

/**
 * Verify JWT token with blacklist checking
 * Enhanced version of verifyJWT that includes blacklist validation
 * @param {string} token - JWT token to verify
 * @param {Object} [options] - Verification options
 * @param {boolean} [options.skipBlacklistCheck=false] - Skip blacklist checking
 * @param {boolean} [options.gracefulBlacklistFailure=true] - Continue if blacklist check fails
 * @returns {Promise<Object|null>} Decoded token payload or null if invalid/blacklisted
 */
export async function verifyJWTWithBlacklist(token, options = {}) {
  const { skipBlacklistCheck = false, gracefulBlacklistFailure = true } =
    options;

  try {
    // First, perform standard JWT verification
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return null;
    }

    // Skip blacklist check if requested
    if (skipBlacklistCheck) {
      return decoded;
    }

    // Check if token is blacklisted
    try {
      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) {
        console.log("Token rejected: found in blacklist");
        return null;
      }
    } catch (blacklistError) {
      console.error("Blacklist check failed:", blacklistError);

      if (gracefulBlacklistFailure) {
        // Log the error but allow the request to proceed
        console.warn(
          "Proceeding with JWT validation due to blacklist check failure"
        );
        return decoded;
      } else {
        // Strict mode: reject token if blacklist check fails
        console.error("Rejecting token due to blacklist check failure");
        return null;
      }
    }

    return decoded;
  } catch (error) {
    console.error("JWT verification with blacklist error:", error);
    return null;
  }
}

/**
 * Validate token with comprehensive checks
 * Combines JWT verification, blacklist checking, and validity checks
 * @param {string} token - JWT token to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.skipBlacklistCheck=false] - Skip blacklist checking
 * @param {boolean} [options.gracefulBlacklistFailure=true] - Continue if blacklist check fails
 * @returns {Promise<Object>} Validation result with detailed information
 */
export async function validateToken(token, options = {}) {
  const result = {
    isValid: false,
    decoded: null,
    error: null,
    metadata: null,
    blacklistChecked: false,
    blacklistError: null,
  };

  try {
    // Extract metadata first
    result.metadata = getTokenMetadata(token);
    if (!result.metadata) {
      result.error = "Invalid token format";
      return result;
    }

    // Verify token with blacklist checking
    const decoded = await verifyJWTWithBlacklist(token, options);
    if (!decoded) {
      result.error = "Token verification failed or token is blacklisted";
      return result;
    }

    // Check if token is valid (has required fields and not expired)
    if (!isTokenValid(decoded)) {
      result.error = "Token is invalid or expired";
      return result;
    }

    result.isValid = true;
    result.decoded = decoded;
    result.blacklistChecked = !options.skipBlacklistCheck;

    return result;
  } catch (error) {
    result.error = error.message;
    result.blacklistError =
      error.name === "BlacklistError" ? error.message : null;
    return result;
  }
}

/**
 * Quick token validation for middleware use
 * Optimized for performance with minimal error details
 * @param {string} token - JWT token to validate
 * @returns {Promise<boolean>} True if token is valid and not blacklisted
 */
export async function isValidToken(token) {
  try {
    const result = await validateToken(token, {
      gracefulBlacklistFailure: true,
    });
    return result.isValid;
  } catch (error) {
    console.error("Quick token validation error:", error);
    return false;
  }
}

/**
 * Extract JWT token from request headers and cookies
 * Checks Authorization header first, then falls back to cookies
 * @param {Request} request - Request object
 * @returns {string|null} JWT token or null if not found
 */
export function extractTokenFromRequest(request) {
  try {
    // First, try Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token) {
        return token;
      }
    }

    // Fallback to cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth_token' && value) {
          return value;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting token from request:', error);
    return null;
  }
}
