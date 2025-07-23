//edit board data
//get board by board id

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function GET(request, { params }) {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('boards')
            .select('*')
            .eq('id', id)

        if (error) {
            console.error("Error fetching board:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 返回第一个结果，因为data是一个数组
        return NextResponse.json(data?.[0] || null);
    } catch (error) {
        console.error("Exception when fetching board:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

//boardId, data
export async function PUT(request, { params }) {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const session = await getServerSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const requestData = await request.json();
        const { boardName, slug, description, color, categoryIcon, visibility, anonymousPost } = requestData;
        const { data, error } = await supabase
            .from('boards')
            .update({
                name: boardName,
                slug: slug,
                description: description,
                color: color,
                icon: categoryIcon,
                visibility: visibility,
                anonymous: anonymousPost,
                updated_at: new Date(),
            })
            .eq('id', id)

        if (error) {
            console.error("Error updating board:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Exception when updating board:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
