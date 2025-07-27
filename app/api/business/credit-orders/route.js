import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function POST(request) {
    const { data } = await request.json();
    
    // 获取用户会话
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        const { credit_order, error } = await supabase
        .from("credit_orders")
        .insert({
            business_user_id: user.id,
            plan_id: data.planId,
            quantity: data.quantity,
            total_price: data.totalPrice,
            currency: data.currency,
            status: 'pending',
            created_by: user.id,
            created_at: new Date(),
            updated_at: new Date(),
        })
        .select('id, business_user_id, plan_id, quantity, total_price, currency, status, created_by, created_at, updated_at')
        .single();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, credit_order: credit_order });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}