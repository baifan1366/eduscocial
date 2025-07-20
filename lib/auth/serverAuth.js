import { cookies } from 'next/headers';
import { verifyJWT, isTokenValid } from './jwt';
import { 
  isTokenBlacklisted, 
  blacklistToken, 
  blacklistUserTokens, 
  trackUserToken,
  getBlacklistStats,
  removeFromBlacklist
} from './tokenBlacklist';

/**
 * A utility function to get the user session on the server side
 * Replaces NextAuth's getServerSession in API routes
 * Now includes blacklist validation for enhanced security
 * 
 * @returns {Promise<Object|null>} The session object or null if no valid session
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      return null;
    }
    
    const decoded = await verifyJWT(authToken);
    
    if (!isTokenValid(decoded)) {
      return null;
    }
    
    // Check if token is blacklisted (NEW: blacklist validation)
    const isBlacklisted = await isTokenBlacklisted(authToken);
    if (isBlacklisted) {
      console.log('getServerSession: Token is blacklisted, rejecting session');
      return null;
    }
    
    // Format the returned object to match the structure of NextAuth's session
    return {
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        username: decoded.username,
        role: decoded.role,
      },
      expires: new Date(decoded.exp * 1000).toISOString(),
      token: authToken // Include token for potential blacklisting operations
    };
  } catch (error) {
    console.error('getServerSession: Error verifying JWT token:', error);
    return null;
  }
}

// Helper to check if user has required role
export function hasRequiredRole(session, requiredRoles) {
  if (!session || !session.user) {
    return false;
  }
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(session.user.role);
  }
  
  return session.user.role === requiredRoles;
}

// Helper function to get user id from JWT token
export async function getUserIdFromRequest(req) {
  // Try to get auth token from cookies
  const authToken = (await cookies()).get('auth_token')?.value;
  
  // If not in cookies, try authorization header
  const authHeader = req.headers.get('Authorization');
  const headerToken = authHeader ? authHeader.replace('Bearer ', '') : null;
  
  const token = authToken || headerToken;
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = await verifyJWT(token);
    if (isTokenValid(decoded)) {
      return decoded.id;
    }
  } catch (error) {
    console.error('Error getting user ID from request:', error);
  }
  
  return null;
}

/**
 * Enhanced function to get user ID from request with blacklist checking
 * @param {Request} req - The request object
 * @returns {Promise<string|null>} User ID if token is valid and not blacklisted
 */
export async function getUserIdFromRequestWithBlacklist(req) {
  // Try to get auth token from cookies
  const authToken = (await cookies()).get('auth_token')?.value;
  
  // If not in cookies, try authorization header
  const authHeader = req.headers.get('Authorization');
  const headerToken = authHeader ? authHeader.replace('Bearer ', '') : null;
  
  const token = authToken || headerToken;
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = await verifyJWT(token);
    if (!isTokenValid(decoded)) {
      return null;
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      console.log('getUserIdFromRequestWithBlacklist: Token is blacklisted');
      return null;
    }
    
    return decoded.id;
  } catch (error) {
    console.error('Error getting user ID from request with blacklist check:', error);
    return null;
  }
}

/**
 * Server-side helper to blacklist the current session token
 * @param {Object} session - Session object from getServerSession
 * @param {string} [reason] - Reason for blacklisting (for logging)
 * @returns {Promise<boolean>} True if token was successfully blacklisted
 */
export async function blacklistCurrentSession(session, reason = 'session_invalidation') {
  if (!session || !session.token) {
    console.error('blacklistCurrentSession: No valid session or token provided');
    return false;
  }
  
  try {
    await blacklistToken(session.token);
    console.log(`Session token blacklisted for user ${session.user.id} (reason: ${reason})`);
    return true;
  } catch (error) {
    console.error('Error blacklisting current session:', error);
    return false;
  }
}

/**
 * Server-side helper to blacklist all tokens for a user
 * @param {string} userId - User ID whose tokens should be blacklisted
 * @param {string} [reason] - Reason for blacklisting (for logging)
 * @returns {Promise<number>} Number of tokens blacklisted
 */
export async function blacklistAllUserTokens(userId, reason = 'admin_action') {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const blacklistedCount = await blacklistUserTokens(userId, reason);
    console.log(`Blacklisted ${blacklistedCount} tokens for user ${userId} (reason: ${reason})`);
    return blacklistedCount;
  } catch (error) {
    console.error('Error blacklisting all user tokens:', error);
    throw error;
  }
}

/**
 * Administrative helper to blacklist a specific token
 * @param {string} token - JWT token to blacklist
 * @param {string} adminUserId - ID of the admin performing the action
 * @param {string} [reason] - Reason for blacklisting
 * @returns {Promise<boolean>} True if token was successfully blacklisted
 */
export async function adminBlacklistToken(token, adminUserId, reason = 'admin_blacklist') {
  if (!token || !adminUserId) {
    throw new Error('Token and admin user ID are required');
  }
  
  try {
    await blacklistToken(token);
    console.log(`Token blacklisted by admin ${adminUserId} (reason: ${reason})`);
    return true;
  } catch (error) {
    console.error('Error in admin token blacklisting:', error);
    throw error;
  }
}

/**
 * Administrative helper to remove a token from blacklist
 * @param {string} token - JWT token to remove from blacklist
 * @param {string} adminUserId - ID of the admin performing the action
 * @param {string} [reason] - Reason for removal
 * @returns {Promise<boolean>} True if token was successfully removed
 */
export async function adminRemoveFromBlacklist(token, adminUserId, reason = 'admin_unblacklist') {
  if (!token || !adminUserId) {
    throw new Error('Token and admin user ID are required');
  }
  
  try {
    const removed = await removeFromBlacklist(token);
    if (removed) {
      console.log(`Token removed from blacklist by admin ${adminUserId} (reason: ${reason})`);
    } else {
      console.log(`Token not found in blacklist (admin: ${adminUserId})`);
    }
    return removed;
  } catch (error) {
    console.error('Error in admin token blacklist removal:', error);
    throw error;
  }
}

/**
 * Administrative helper to get blacklist statistics
 * @param {string} adminUserId - ID of the admin requesting stats
 * @returns {Promise<Object>} Blacklist statistics
 */
export async function adminGetBlacklistStats(adminUserId) {
  if (!adminUserId) {
    throw new Error('Admin user ID is required');
  }
  
  try {
    const stats = await getBlacklistStats();
    console.log(`Blacklist stats requested by admin ${adminUserId}`);
    return {
      ...stats,
      requestedBy: adminUserId,
      requestedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting blacklist stats:', error);
    throw error;
  }
}

/**
 * Helper to track a token for a user (for global logout functionality)
 * @param {string} userId - User ID
 * @param {string} token - JWT token to track
 * @returns {Promise<void>}
 */
export async function trackTokenForUser(userId, token) {
  if (!userId || !token) {
    console.error('trackTokenForUser: User ID and token are required');
    return;
  }
  
  try {
    await trackUserToken(userId, token);
  } catch (error) {
    console.error('Error tracking token for user:', error);
    // Don't throw error to avoid breaking the authentication flow
  }
}

/**
 * Validate session with enhanced security checks
 * @param {Object} session - Session object to validate
 * @returns {Promise<boolean>} True if session is valid and not blacklisted
 */
export async function validateSessionSecurity(session) {
  if (!session || !session.token || !session.user) {
    return false;
  }
  
  try {
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(session.token);
    if (isBlacklisted) {
      console.log(`Session validation failed: token blacklisted for user ${session.user.id}`);
      return false;
    }
    
    // Additional security checks can be added here
    return true;
  } catch (error) {
    console.error('Error validating session security:', error);
    // In case of error, allow session to proceed (graceful degradation)
    return true;
  }
} 