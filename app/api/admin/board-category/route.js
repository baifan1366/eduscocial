import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

// use board id to get the board category mappings
export async function POST(request) {
    const { boardId } = await request.json();
    
    // 检查boardId是否有效
    if (!boardId) {
        return NextResponse.json({ categories: [] }, { status: 200 });
    }

    try {
        const { data: existing, error } = await supabase
            .from("board_category_mappings")
            .select("category_id")
            .eq("board_id", boardId);

        if (error) {
            console.error("Error fetching board categories:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 如果没有找到任何分类，返回空数组
        return NextResponse.json({ categories: existing || [] }, { status: 200 });
    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json({ categories: [], error: "Unexpected error occurred" }, { status: 500 });
    }
}

export async function PUT(request) {
    const { data } = await request.json();
    const { boardId, selectedCategoryIds } = data;
    
    // 验证必要的数据
    if (!boardId || !Array.isArray(selectedCategoryIds)) {
        return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // 获取用户会话
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        // 1. 取得当前 DB 中的分类列表
        const { data: existing, error } = await supabase
            .from("board_category_mappings")
            .select("category_id")
            .eq("board_id", boardId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const existingIds = existing?.map((row) => row.category_id) ?? [];

        // 2. Diff 出需要操作的 ID
        const toAdd = selectedCategoryIds.filter(id => !existingIds.includes(id));
        const toRemove = existingIds.filter(id => !selectedCategoryIds.includes(id));

        // 插入新的映射
        if (toAdd.length > 0) {
            const insertData = toAdd.map(categoryId => ({
                board_id: boardId,
                category_id: categoryId,
                created_by: user.id,
                created_at: new Date(),
                updated_at: new Date(),
            }));
        
            const { error: newMappingError } = await supabase
                .from("board_category_mappings")
                .insert(insertData);

            if (newMappingError) {
                return NextResponse.json({ error: newMappingError.message }, { status: 500 });
            }
        }
      
        // 删除取消选中的映射
        if (toRemove.length > 0) {
            const { error: removedMappingError } = await supabase
                .from("board_category_mappings")
                .delete()
                .match({ board_id: boardId })
                .in("category_id", toRemove);

            if (removedMappingError) {
                return NextResponse.json({ error: removedMappingError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ message: "Board category mappings updated successfully" }, { status: 200 });
    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json({ error: "Unexpected error occurred" }, { status: 500 });
    }
}