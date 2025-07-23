//filter created_by_type = user
//filter created_by = user.id = current user id
//get current user id by session
//sort by created_at desc
//limit 5
//map to board list

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Get current user session

export async function GET(request, { params }) {
    const { id } = await params;

    try {
        const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('created_by_type', 'user')
        .eq('created_by', id)
        .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, boards: data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
