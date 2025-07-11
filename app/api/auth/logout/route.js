import { logoutUser } from "../../../../lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await logoutUser();
    
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
