import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function POST(request) {
    const body = await request.json();
    const data = body.data || body;
    
    // 获取用户会话
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    if (!data.planId) {
        return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    try {
        // Fetch and validate the plan first (security improvement)
        const { data: plan, error: planError } = await supabase
            .from("credit_plans")
            .select('id, original_price, discount_price, is_discounted, currency, credit_amount, name')
            .eq('id', data.planId)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        // Calculate total price based on plan (prevent price manipulation)
        const totalPrice = plan.is_discounted ? plan.discount_price : plan.original_price;
        const currency = plan.currency;

        // Allow multiple pending orders for the same plan
        // Users should be able to create multiple orders if needed

        const { data: credit_order, error } = await supabase
        .from("credit_orders")
        .insert({
            business_user_id: user.id,
            plan_id: data.planId,
            quantity: data.quantity || 1,
            total_price: totalPrice, // Use calculated price
            currency: currency, // Use plan currency
            status: 'pending',
            created_by: user.id,
            created_at: new Date(),
            updated_at: new Date(),
        })
        .select('id, business_user_id, plan_id, quantity, total_price, currency, status, created_by, created_at, updated_at')
        .single();

        if (error) throw error;

        if (!credit_order) {
            return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            credit_order: credit_order,
            orderId: credit_order.id
        });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}