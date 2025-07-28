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
            .from('credit_plans')
            .select('*')
            .eq('id', id)

        if (error) {
            console.error("Error fetching credit plan:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data?.[0] || null);
    } catch (error) {
        console.error("Exception when fetching credit plan:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}