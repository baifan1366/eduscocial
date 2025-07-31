import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const paymentIntentId = searchParams.get('payment_intent');
        const orderId = searchParams.get('order_id');

        // Get user session for authentication
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { user } = session;

        if (!paymentIntentId && !orderId) {
            return NextResponse.json({
                error: "Either payment_intent or order_id parameter is required"
            }, { status: 400 });
        }

        let paymentIntent;
        let order;

        // If we have a payment intent ID, retrieve it directly
        if (paymentIntentId) {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            
            if (!paymentIntent) {
                return NextResponse.json({
                    error: "Payment intent not found"
                }, { status: 404 });
            }

            // Verify ownership
            if (paymentIntent.metadata.userId !== user.id) {
                return NextResponse.json({
                    error: "Unauthorized access to payment intent"
                }, { status: 403 });
                }

            // Get order from metadata
            const orderIdFromMetadata = paymentIntent.metadata.orderId;
            if (orderIdFromMetadata) {
                const { data: orderData } = await supabase
                    .from("credit_orders")
                    .select("*")
                    .eq('id', orderIdFromMetadata)
                    .eq('business_user_id', user.id)
                    .single();
                
                order = orderData;
            }
        }
        // If we have an order ID, get the payment intent from the order
        else if (orderId) {
            const { data: orderData, error: orderError } = await supabase
                .from("credit_orders")
                .select("*")
                .eq('id', orderId)
                .eq('business_user_id', user.id)
                .single();

            if (orderError || !orderData) {
                return NextResponse.json({
                    error: "Order not found or unauthorized"
                }, { status: 404 });
            }

            order = orderData;

            // Get payment intent from order
            if (order.payment_reference) {
                paymentIntent = await stripe.paymentIntents.retrieve(order.payment_reference);
            }
        }

        if (!paymentIntent) {
            return NextResponse.json({
                error: "Payment intent not found"
            }, { status: 404 });
        }

        // Update order status based on current payment intent status
        if (order) {
            let newStatus = order.status;
            let shouldUpdate = false;

            switch (paymentIntent.status) {
                case 'succeeded':
                    if (order.status !== 'paid') {
                        newStatus = 'paid';
                        shouldUpdate = true;
                    }
                    break;
                case 'canceled':
                    if (order.status !== 'cancelled') {
                        newStatus = 'cancelled';
                        shouldUpdate = true;
                    }
                    break;
                case 'payment_failed':
                    if (order.status !== 'failed') {
                        newStatus = 'failed';
                        shouldUpdate = true;
                    }
                    break;
                case 'requires_payment_method':
                case 'requires_confirmation':
                case 'requires_action':
                    // Keep as pending for these statuses
                    break;
            }

            if (shouldUpdate) {
                const updateData = {
                    status: newStatus,
                    updated_at: new Date()
                };

                // If payment succeeded, record the payment date
                if (newStatus === 'paid') {
                    updateData.paid_at = new Date();
                }

                const { error: updateError } = await supabase
                    .from("credit_orders")
                    .update(updateData)
                    .eq('id', order.id);

                if (updateError) {
                    console.error('Failed to update order status:', updateError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            payment_intent: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                payment_method: paymentIntent.payment_method,
                last_payment_error: paymentIntent.last_payment_error
            },
            order: order ? {
                id: order.id,
                status: order.status,
                total_price: order.total_price,
                currency: order.currency,
                paid_at: order.paid_at
            } : null
        });

    } catch (error) {
        console.error('Error checking payment status:', error);
        return NextResponse.json({ 
            error: "Failed to check payment status" 
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const requestData = await request.json();
        const { paymentIntentId, orderId } = requestData;

        // Get user session for authentication
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { user } = session;

        if (!paymentIntentId && !orderId) {
            return NextResponse.json({
                error: "Either paymentIntentId or orderId is required"
            }, { status: 400 });
        }

        // This endpoint can be used to manually refresh payment status
        // Redirect to GET method with same parameters
        const params = new URLSearchParams();
        if (paymentIntentId) params.set('payment_intent', paymentIntentId);
        if (orderId) params.set('order_id', orderId);

        const url = new URL(request.url);
        url.search = params.toString();

        // Call the GET method internally
        const getRequest = new Request(url.toString(), { method: 'GET' });
        return await GET(getRequest);

    } catch (error) {
        console.error('Error refreshing payment status:', error);
        return NextResponse.json({ 
            error: "Failed to refresh payment status" 
        }, { status: 500 });
    }
}
