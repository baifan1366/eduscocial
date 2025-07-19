import { cookies } from 'next/headers';
import { verifyJWT, isTokenValid } from './jwt';

/**
 * A utility function to get the user session on the server side
 * Replaces NextAuth's getServerSession in API routes
 * 
 * @returns {Promise<Object|null>} The session object or null if no valid session
 */
export async function getServerSession() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  
  if (!authToken) {
    return null;
  }
  
  try {
    const decoded = await verifyJWT(authToken);
    
    if (!isTokenValid(decoded)) {
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
      expires: new Date(decoded.exp * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error verifying JWT token:', error);
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