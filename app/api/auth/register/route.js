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
    
    try {
      const user = await registerUser({ name, email, password });
      
      return NextResponse.json({ 
        success: true, 
        message: "User registered successfully" 
      });
    } catch (registrationError) {
      console.error('Registration error in API route:', registrationError);
      
      if (registrationError.message.includes('already exists')) {
        return NextResponse.json(
          { error: registrationError.message },
          { status: 409 }
        );
      }
      
      if (registrationError.message.includes('educational email')) {
        return NextResponse.json(
          { error: registrationError.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: registrationError.message || "Registration failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in registration route:', error);
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 