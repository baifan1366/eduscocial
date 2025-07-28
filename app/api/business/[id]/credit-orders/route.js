import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function GET(request, { params }) {
    const { id } = params;

    // 获取用户会话
    const session = await getServerSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: credit_orders, error } = await supabase
        .from("credit_orders")
        .select('id, business_user_id, plan_id, quantity, total_price, currency, status, created_by, created_at, updated_at')
        .eq('business_user_id', id)
        .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, credit_orders: credit_orders || [] });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}