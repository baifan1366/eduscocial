import { loginUser } from "../../../../lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    
    const { user, session, error } = await loginUser({ email, password });
    
    if (error || !user) {
      console.error('Login failed:', error || 'No user returned');
      return NextResponse.json(
        { error: error || "Login failed" },
        { status: 401 }
      );
    }
    
    // Create a response with session cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name || user.username,
        role: user.role || "USER",
        isOnline: true,
        image: user.avatar_url || null,
      },
      success: true,
      sessionId: session?.id || null
    });
    
    // Set auth cookie to help with client-side detection
    response.cookies.set({
      name: 'auth-status',
      value: 'authenticated',
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error.message);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 }
    );
  }
}
