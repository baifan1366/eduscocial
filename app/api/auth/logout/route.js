import { logoutUser } from "../../../../lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    // Create response object
    const response = NextResponse.json({
      success: true,
      message: session?.user ? "Logged out successfully" : "No active session"
    });
    
    // Always clear auth cookies regardless of session state
    response.cookies.set({
      name: 'auth-status',
      value: '',
      expires: new Date(0),
      path: '/',
    });
    
    // If there's an active session, also remove from Redis
    if (session?.user?.id) {
      // Call logout function to remove session from Redis
      await logoutUser(session.user.id);
    }
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error.message);
    
    // Even on error, try to clear cookies
    const errorResponse = NextResponse.json(
      { error: "Logout failed", message: error.message },
      { status: 500 }
    );
    
    errorResponse.cookies.set({
      name: 'auth-status',
      value: '',
      expires: new Date(0),
      path: '/',
    });
    
    return errorResponse;
  }
}
