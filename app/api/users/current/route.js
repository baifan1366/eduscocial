import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        name: session.user.name || session.user.username,
        role: session.user.role || "user",
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
