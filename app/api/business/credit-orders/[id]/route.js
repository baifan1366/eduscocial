import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function PUT(request, { params }) {
    const { id } = params;
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
        .update({
            quantity: data.quantity,
            total_price: data.totalPrice,
            currency: data.currency,
            status: data.status,
            payment_provider: data.paymentProvider,
            payment_reference: data.paymentReference,
            paid_at: data.paidAt,
            updated_at: new Date(),
        })
        .eq('id', id)
        .select('id, business_user_id, plan_id, quantity, total_price, currency, status, payment_provider, payment_reference, paid_at, created_at, updated_at')
        .single();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, credit_order: credit_order });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}