import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getUserSession } from "@/lib/redis/redisUtils";

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("session-token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      );
    }
    
    // Verify session token (this is a simple example; use JWT verification in production)
    const userId = sessionToken.split(':')[0]; // Assuming token format is userId:timestamp
    
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session token" },
        { status: 401 }
      );
    }
    
    // Get user session from Redis
    const sessionData = await getUserSession(userId);
    
    if (!sessionData) {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }
    
    // Get user data from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, display_name, username, role')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }
    
    // Return user data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name || user.username,
        role: user.role || "USER"
      }
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
