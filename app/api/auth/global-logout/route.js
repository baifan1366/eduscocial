import { NextResponse } from 'next/server';
import { getServerSession, blacklistAllUserTokens } from '@/lib/auth/serverAuth';
import { deleteSession } from '@/lib/auth/session';
import { removeUserSession } from '@/lib/redis/redisUtils';
import { removeAuthCookie } from '@/lib/auth/cookies';

/**
 * Global logout API route - logs out user from all devices
 * POST /api/auth/global-logout
 * 
 * This endpoint:
 * 1. Validates the current session
 * 2. Blacklists all JWT tokens for the user
 * 3. Clears all Redis session data for the user
 * 4. Removes authentication cookies
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export async function POST(request) {
  try {
    // Get current session to validate user authorization
    const session = await getServerSession();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { 
          error: 'UNAUTHORIZED',
          message: 'Authentication required for global logout' 
        },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const userRole = session.user.role || 'user';
    
    console.log(`Global logout initiated for user ${userId} (role: ${userRole})`);
    
    // Step 1: Blacklist all JWT tokens for this user
    let blacklistedTokenCount = 0;
    try {
      blacklistedTokenCount = await blacklistAllUserTokens(userId, 'global_logout');
      console.log(`Blacklisted ${blacklistedTokenCount} tokens for user ${userId}`);
    } catch (blacklistError) {
      console.error('Error blacklisting user tokens during global logout:', blacklistError);
      // Continue with logout even if blacklisting fails partially
    }
    
    // Step 2: Clear all Redis session data for the user
    const sessionCleanupResults = await Promise.allSettled([
      // Remove main session data
      deleteSession(userId),
      // Remove user session from redisUtils
      removeUserSession(userId),
      // Clear any provider tokens
      clearProviderTokens(userId),
      // Clear user interests and cached data
      clearUserCachedData(userId)
    ]);
    
    // Log any session cleanup failures
    sessionCleanupResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const operations = ['deleteSession', 'removeUserSession', 'clearProviderTokens', 'clearUserCachedData'];
        console.error(`Session cleanup failed for ${operations[index]}:`, result.reason);
      }
    });
    
    // Step 3: Create response and remove authentication cookies
    const response = NextResponse.json({
      message: 'Global logout successful',
      details: {
        userId: userId,
        tokensBlacklisted: blacklistedTokenCount,
        sessionCleared: true,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });
    
    // Remove authentication cookie
    removeAuthCookie(response);
    
    console.log(`Global logout completed for user ${userId}`);
    
    return response;
    
  } catch (error) {
    console.error('Global logout error:', error);
    
    // Create error response with cookie removal for security
    const response = NextResponse.json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Global logout failed due to server error'
    }, { status: 500 });
    
    // Still remove auth cookie even if logout failed
    removeAuthCookie(response);
    
    return response;
  }
}

/**
 * Clear provider tokens for a user from Redis
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function clearProviderTokens(userId) {
  try {
    const redis = (await import('@/lib/redis/redis.js')).default;
    
    // Get all keys for user provider tokens
    const tokenKeys = await redis.keys(`user:${userId}:tokens:*`);
    
    if (tokenKeys.length > 0) {
      await redis.del(...tokenKeys);
      console.log(`Cleared ${tokenKeys.length} provider token sets for user ${userId}`);
    }
  } catch (error) {
    console.error('Error clearing provider tokens:', error);
    throw error;
  }
}

/**
 * Clear user cached data from Redis
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function clearUserCachedData(userId) {
  try {
    const redis = (await import('@/lib/redis/redis.js')).default;
    
    // Clear various user-specific cached data
    const keysToDelete = [
      `user:${userId}:interests`,
      `user:${userId}:recommended_posts`,
      `online_users` // Will remove user from online users hash
    ];
    
    // Remove user from online users hash specifically
    await redis.hdel('online_users', userId);
    
    // Delete other user-specific keys
    const existingKeys = [];
    for (const key of keysToDelete.slice(0, -1)) { // Skip online_users as it's handled above
      const exists = await redis.exists(key);
      if (exists) {
        existingKeys.push(key);
      }
    }
    
    if (existingKeys.length > 0) {
      await redis.del(...existingKeys);
      console.log(`Cleared ${existingKeys.length} cached data entries for user ${userId}`);
    }
  } catch (error) {
    console.error('Error clearing user cached data:', error);
    throw error;
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}