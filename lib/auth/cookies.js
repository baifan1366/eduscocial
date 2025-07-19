/**
 * Cookie management utilities for authentication
 * Handles setting, getting, and removing secure cookies
 */

import { cookies } from 'next/headers';
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies';

// Cookie name for auth token
const AUTH_COOKIE_NAME = 'auth_token';

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Set auth token cookie
 * @param {NextResponse} response - Next.js response object
 * @param {string} token - JWT token
 */
export function setAuthCookie(response, token) {
  // For server-side response objects
  if (response?.cookies?.set) {
    response.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
    return;
  }

  // For client-side
  const cookieString = `${AUTH_COOKIE_NAME}=${token}; Path=${cookieOptions.path}; Max-Age=${cookieOptions.maxAge}; ${cookieOptions.httpOnly ? 'HttpOnly;' : ''} ${cookieOptions.secure ? 'Secure;' : ''} SameSite=${cookieOptions.sameSite}`;
  
  if (typeof window !== 'undefined') {
    document.cookie = cookieString;
  } else if (response?.headers) {
    response.headers.append('Set-Cookie', cookieString);
  }
}

/**
 * Get auth token from cookie
 * @returns {string|null} Auth token or null if not found
 */
export function getAuthCookie() {
  // Server-side
  if (typeof window === 'undefined') {
    try {
      const cookieStore = cookies();
      return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
    } catch (error) {
      // If cookies() throws, we might be in an environment where it's not available
      return null;
    }
  }

  // Client-side
  return getCookieFromString(document.cookie, AUTH_COOKIE_NAME);
}

/**
 * Remove auth token cookie
 * @param {NextResponse} response - Next.js response object
 */
export function removeAuthCookie(response) {
  // For server-side response objects
  if (response?.cookies?.set) {
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      ...cookieOptions,
      maxAge: 0,
    });
    return;
  }
  
  // For client-side
  const expiredCookieString = `${AUTH_COOKIE_NAME}=; Path=${cookieOptions.path}; Max-Age=0; ${cookieOptions.httpOnly ? 'HttpOnly;' : ''} ${cookieOptions.secure ? 'Secure;' : ''} SameSite=${cookieOptions.sameSite}`;
  
  if (typeof window !== 'undefined') {
    document.cookie = expiredCookieString;
  } else if (response?.headers) {
    response.headers.append('Set-Cookie', expiredCookieString);
  }
}

/**
 * Get cookie value from cookie string
 * @param {string} cookieString - Cookie string (document.cookie)
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
function getCookieFromString(cookieString, name) {
  if (!cookieString) return null;
  
  const cookies = cookieString.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

/**
 * Parse cookies from request
 * @param {Request} request - Request object
 * @returns {RequestCookies} Cookies object
 */
export function parseCookies(request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return new RequestCookies(new Headers());
  
  const requestHeaders = new Headers();
  requestHeaders.append('cookie', cookieHeader);
  return new RequestCookies(requestHeaders);
} 