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

    // Fix null status by setting it to 'pending' if it's null
    if (data.status === null || data.status === undefined) {
        const { data: updatedData, error: updateError } = await supabase
            .from("credit_orders")
            .update({ status: 'pending', updated_at: new Date() })
            .eq('id', id)
            .select("*")
            .single();

        if (updateError) {
            console.error('Failed to update null status:', updateError);
        } else {
            data.status = 'pending'; // Update the local data
        }
    }

    return NextResponse.json({ success: true, credit_order: data });
}

// PATCH endpoint for updating order status as documented
export async function PATCH(request, { params }) {
    const { id } = await params;
    const body = await request.json();
    const { status, stripePaymentIntentId, payment_reference, payment_provider, error_message } = body;

    // Get user session for authentication
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        // Validate status if provided
        const validStatuses = ['pending', 'paid', 'cancelled', 'failed', 'refunded'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            }, { status: 400 });
        }

        // First, verify the order belongs to the current user (through business_user relationship)
        const { data: existingOrder, error: fetchError } = await supabase
            .from("credit_orders")
            .select('id, business_user_id, status')
            .eq('id', id)
            .single();

        if (fetchError || !existingOrder) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Check if user owns this order (through business_user relationship)
        const { data: businessUser, error: businessError } = await supabase
            .from("business_users")
            .select('id')
            .eq('id', existingOrder.business_user_id)
            .eq('user_id', user.id)
            .single();

        if (businessError || !businessUser) {
            return NextResponse.json({ error: "Unauthorized to update this order" }, { status: 403 });
        }

        // Prepare update data
        const updateData = {
            updated_at: new Date(),
        };

        if (status) {
            updateData.status = status;

            // Set paid_at timestamp when status changes to paid
            if (status === 'paid' && existingOrder.status !== 'paid') {
                updateData.paid_at = new Date();
            }
        }

        // Handle payment reference (support both old and new parameter names)
        if (payment_reference) {
            updateData.payment_reference = payment_reference;
        } else if (stripePaymentIntentId) {
            updateData.payment_reference = stripePaymentIntentId;
        }

        if (payment_provider) {
            updateData.payment_provider = payment_provider;
        } else if (stripePaymentIntentId) {
            updateData.payment_provider = 'stripe';
        }

        // Store error message if provided
        if (error_message) {
            updateData.error_message = error_message;
        }

        // Update the order
        const { data: updatedOrder, error: updateError } = await supabase
            .from("credit_orders")
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (updateError) {
            console.error('Failed to update order:', updateError);
            return NextResponse.json({
                error: "Failed to update order"
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            order: updatedOrder
        });

    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({
            error: error.message || "Failed to update order status"
        }, { status: 500 });
    }
}
