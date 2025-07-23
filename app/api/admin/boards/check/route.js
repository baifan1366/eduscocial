import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

/**
 * 检查板块名称是否已存在的API
 * GET /api/admin/boards/check?name=boardName
 */
export async function GET(request) {
    // 获取用户会话
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const searchParams = new URL(request.url).searchParams;
        const name = searchParams.get('name');

        if (!name) {
            return NextResponse.json(
                { error: "Board name is required" }, 
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // 检查名称是否已存在
        const { data, error } = await supabase
            .from("boards")
            .select("id")
            .ilike("name", name)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return NextResponse.json({ 
            exists: !!data,
            board: data || null
        });
    } catch (error) {
        console.error('检查板块名称失败:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 