import { NextRequest, NextResponse } from "next/server";
import { isEducationalEmail, verifyEducationalEmailWithAPI } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // First perform basic validation
    const isEduBasic = isEducationalEmail(email);
    
    // If the basic check passes, we can skip API call
    if (isEduBasic) {
      return NextResponse.json({
        isEducational: true,
        method: "basic",
      });
    }
    
    // If basic check fails, try with API
    const isEduAPI = await verifyEducationalEmailWithAPI(email);
    
    return NextResponse.json({
      isEducational: isEduAPI,
      method: "api",
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Email validation failed" },
      { status: 500 }
    );
  }
} 