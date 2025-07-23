import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

// Get current user session

// get board data content
// create board
export async function POST(request) {
    const { data } = await request.json();
    
    // 获取用户会话
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        const { boards, error } = await supabase
        .from("boards")
        .insert({
            name: data.boardName,
            slug: data.slug,
            description: data.description,
            color: data.color,
            icon: data.categoryIcon,
            visibility: data.visibility,
            anonymous: data.anonymousPost,
            created_by: user.id,
            created_by_type: 'admin',
            created_at: new Date(),
            updated_at: new Date(),
        })
        .select('id, name, slug, description, color, icon, visibility, anonymous, created_by, created_by_type, created_at, updated_at')
        .single();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, board: boards });
    } catch (error) {
        console.error('创建板块失败:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}