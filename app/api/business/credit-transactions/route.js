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
        const { credit_transaction, error } = await supabase
        .from("credit_transactions")
        .insert({
            business_user_id: user.id,
            order_id: data.orderId,
            type: data.type,
            credit_change: data.creditChange,
            balance_after: data.balanceAfter,
            description: data.description,
            created_at: new Date(),
        })
        .select('id, business_user_id, order_id, type, credit_change, balance_after, description, created_at')
        .single();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, credit_transaction: credit_transaction });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}