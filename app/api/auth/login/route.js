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
    
    const { user } = await loginUser({ email, password });
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 }
    );
  }
}
