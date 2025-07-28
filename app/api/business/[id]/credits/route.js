import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function GET(request, { params }) {
    const { id } = params;
    const { data } = await request.json();
    
    // 获取用户会话
    const session = await getServerSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        const { business_credit, error } = await supabase
        .from("business_credits")
        .select('id, business_user_id, total_credits, used_credits, updated_at')
        .eq('business_user_id', id)
        .single();

        if (error) throw error;

        return NextResponse.json({ success: true, business_credit: business_credit });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const { id } = params;
    const { data } = await request.json();
    
    // 获取用户会话
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        const { business_credit, error } = await supabase
        .from("business_credits")
        .update({
            total_credits: data.totalCredits,
            used_credits: data.usedCredits,
            updated_at: new Date(),
        })
        .eq('id', id)
        .select('id, business_user_id, total_credits, used_credits, updated_at')
        .single();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, business_credit: business_credit });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}