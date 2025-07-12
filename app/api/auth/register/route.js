import { registerUser } from "../../../../lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    
    const user = await registerUser({ name, email, password });
    
    return NextResponse.json({ 
      success: true, 
      message: "User registered successfully" 
    });
    
  } catch (error) {
    console.error('Registration error:', error.message);
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 400 }
    );
  }
}
