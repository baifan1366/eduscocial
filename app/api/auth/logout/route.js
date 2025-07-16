import { logoutUser } from "../../../../lib/auth";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";

export async function POST(request) {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({
        success: true,
        message: "No active session"
      });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Call logout function to remove session from Redis
    await logoutUser(userId);
    
    return NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });
    
  } catch (error) {
    console.error('Logout error:', error.message);
    return NextResponse.json(
      { error: "Logout failed", message: error.message },
      { status: 500 }
    );
  }
}
