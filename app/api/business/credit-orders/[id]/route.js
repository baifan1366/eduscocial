import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function PUT(request, { params }) {
    const { id } = await params;

    try {
        const requestBody = await request.json();
        const { data } = requestBody;

        // Validate that data exists
        if (!data) {
            return NextResponse.json({
                error: "Missing data in request body"
            }, { status: 400 });
        }

        // 获取用户会话
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Prepare update data with only defined values
        const updateData = {
            updated_at: new Date(),
        };

        if (data.status !== undefined) updateData.status = data.status;
        if (data.paymentProvider !== undefined) updateData.payment_provider = data.paymentProvider;
        if (data.paymentReference !== undefined) updateData.payment_reference = data.paymentReference;
        if (data.paidAt !== undefined) updateData.paid_at = data.paidAt;

        const { data: credit_order, error } = await supabase
        .from("credit_orders")
        .update(updateData)
        .eq('id', id)
        .select('id, business_user_id, plan_id, quantity, total_price, currency, status, payment_provider, payment_reference, paid_at, created_at, updated_at')
        .single();

        if (error) throw error;

        return NextResponse.json({ success: true, credit_order: credit_order });
    } catch (error) {
        console.error('PUT /api/business/credit-orders/[id] error:', error);
        return NextResponse.json({
            error: error.message || "Failed to update credit order"
        }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    const { id } = await params;
    const { data, error } = await supabase
    .from("credit_orders")
    .select("*")
    .eq('id', id)
    .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Credit order not found" }, { status: 404 });

    return NextResponse.json({ success: true, credit_order: data });
}

// PATCH endpoint for updating order status as documented
export async function PATCH(request, { params }) {
    const { id } = await params;
    const body = await request.json();
    const { status, stripePaymentIntentId } = body;

    // Get user session for authentication
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        // Validate the order belongs to the current user
        const { data: existingOrder, error: fetchError } = await supabase
            .from("credit_orders")
            .select('id, business_user_id, status')
            .eq('id', id)
            .eq('business_user_id', user.id)
            .single();

        if (fetchError || !existingOrder) {
            return NextResponse.json({
                error: "Order not found or unauthorized"
            }, { status: 404 });
        }

        // Prepare update data
        const updateData = {
            status: status,
            updated_at: new Date(),
        };

        // Add payment-specific fields if status is paid
        if (status === 'paid' && stripePaymentIntentId) {
            updateData.payment_reference = stripePaymentIntentId;
            updateData.payment_provider = 'stripe';
            updateData.paid_at = new Date();
        }

        // Update the order
        const { data: updatedOrder, error: updateError } = await supabase
            .from("credit_orders")
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            credit_order: updatedOrder
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json({
            error: error.message || "Failed to update order status"
        }, { status: 500 });
    }
}
