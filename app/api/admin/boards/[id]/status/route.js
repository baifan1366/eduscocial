import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

//update status (pending, approved, rejected) of board use PATCH method
export async function PATCH(request, { params }) {
    const { id } = await params;
    const { status } = await request.json();
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
        .from('boards')
        .update({ status })
        .eq('id', id)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}
