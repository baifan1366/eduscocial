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
        const { credit_transactions, error } = await supabase
        .from("credit_transactions")
        .select('id, business_user_id, order_id, type, credit_change, balance_after, description, created_at')
        .eq('business_user_id', id)
        .single();

        if (error) throw error;

        return NextResponse.json({ success: true, credit_transactions: credit_transactions });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}