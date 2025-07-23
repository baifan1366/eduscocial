import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function POST(request) {
    const { data } = await request.json();
    const { user } = await getServerSession();
    
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { categories, error } = await supabase
        .from("board_categories")
        .insert({
            name: data.name,
            description: data.description,
            color: data.color,
            icon: data.icon,
            parent_id: null,
            is_active: false,
            created_by: user.id,
            created_at: new Date(),
            updated_at: new Date(),
        })
        .select('id, name, description, color, icon, parent_id, is_active, created_by, created_at, updated_at')
        .single();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, category: categories });
    } catch (error) {
        console.error('创建板块失败:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}