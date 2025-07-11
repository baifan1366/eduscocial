import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { isEducationalEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email is educational
    if (!isEducationalEmail(email)) {
      return NextResponse.json(
        { error: "Only educational email addresses are allowed" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Generate a username from email if not provided
        username: body.username || email.split('@')[0],
        // Set other optional fields
        university: body.university,
        studyField: body.studyField,
      },
      // Select what to return to client
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        university: true,
        studyField: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: "User registered successfully",
      user
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
} 