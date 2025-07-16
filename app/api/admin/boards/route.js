import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

//get current user id using nextauth

// get board data content
// create board
export async function POST(request) {
    const { data } = await request.json();
    
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        const { boards, error } = await supabase.from("boards").insert({
            name: data.boardName,
            slug: data.slug,
            description: data.description,
            color: data.color,
            icon: data.categoryIcon,
            visibility: data.visibility,
            anonymous: data.anonymousPost,
            created_by: user.id,
            created_at: new Date(),
            updated_at: new Date(),
        }).select();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('创建板块失败:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}