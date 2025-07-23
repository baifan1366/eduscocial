import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

//update is_active status of board use PATCH method
//either true or false is_active
export async function PATCH(request, { params }) {
    const { id } = await params;
    const { is_active } = await request.json();
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
        .from('boards')
        .update({ is_active })
        .eq('id', id)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}
