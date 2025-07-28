import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
    const { orderId, planId, userId } = paymentIntent.metadata;

    if (!orderId) {
        console.error('No orderId in payment intent metadata');
        return;
    }

    try {
        // First, check if order was already processed to prevent duplicate credit processing
        const { data: existingOrder, error: checkError } = await supabase
            .from("credit_orders")
            .select(`
                id, business_user_id, plan_id, total_price, currency, status,
                credit_plans (id, credit_amount, name)
            `)
            .eq('id', orderId)
            .single();

        if (checkError || !existingOrder) {
            throw new Error('Failed to fetch order details');
        }

        if (existingOrder.status === 'paid') {
            console.log(`Order ${orderId} already processed, skipping credit processing`);
            return NextResponse.json({ received: true });
        }

        // Update order status to paid
        const { error: orderError } = await supabase
            .from("credit_orders")
            .update({
                status: 'paid',
                payment_reference: paymentIntent.id,
                payment_provider: 'stripe',
                paid_at: new Date(),
                updated_at: new Date(),
            })
            .eq('id', orderId);

        if (orderError) {
            throw orderError;
        }

        // Use the order data we already fetched
        const order = existingOrder;

        // Get current credits to add to them instead of replacing
        const { data: currentCredits } = await supabase
            .from("business_credits")
            .select('total_credits, used_credits')
            .eq('business_user_id', order.business_user_id)
            .single();

        const currentTotalCredits = currentCredits?.total_credits || 0;
        const currentUsedCredits = currentCredits?.used_credits || 0;

        // Add credits to user account (add to existing, don't replace)
        const { error: creditsError } = await supabase
            .from("business_credits")
            .upsert({
                business_user_id: order.business_user_id,
                total_credits: currentTotalCredits + order.credit_plans.credit_amount,
                used_credits: currentUsedCredits,
                updated_at: new Date(),
            }, {
                onConflict: 'business_user_id',
                ignoreDuplicates: false,
            });

        if (creditsError) {
            console.error('Failed to update user credits:', creditsError);
        }

        // Create credit transaction record (check for duplicates first)
        const { data: existingTransaction } = await supabase
            .from("credit_transactions")
            .select('id')
            .eq('order_id', orderId)
            .eq('business_user_id', order.business_user_id)
            .eq('type', 'purchase')
            .single();

        if (!existingTransaction) {
            const { error: transactionError } = await supabase
                .from("credit_transactions")
                .insert({
                    business_user_id: order.business_user_id,
                    order_id: orderId,
                    type: 'purchase',
                    credit_change: order.credit_plans.credit_amount,
                    balance_after: currentTotalCredits + order.credit_plans.credit_amount,
                    description: `Credit purchase - ${order.credit_plans.name}`,
                    created_at: new Date(),
                });

            if (transactionError) {
                console.error('Failed to create credit transaction:', transactionError);
            }
        } else {
            console.log(`Credit transaction already exists for order ${orderId}, skipping creation`);
        }

        // Create invoice record (check for duplicates first)
        const { data: existingInvoice } = await supabase
            .from("invoices")
            .select('id')
            .eq('order_id', orderId)
            .single();

        if (!existingInvoice) {
            const { error: invoiceError } = await supabase
                .from("invoices")
                .insert({
                    business_user_id: order.business_user_id,
                    order_id: orderId,
                    amount: order.total_price,
                    currency: order.currency,
                    status: 'paid',
                    invoice_number: `INV-${Date.now()}-${orderId.slice(-8)}`,
                    created_at: new Date(),
                });

            if (invoiceError) {
                console.error('Failed to create invoice:', invoiceError);
            }
        } else {
            console.log(`Invoice already exists for order ${orderId}, skipping creation`);
        }



        // Log successful payment processing
        console.log(`Payment processing completed successfully for order ${orderId}:`, {
            businessUserId: order.business_user_id,
            planName: order.credit_plans.name,
            creditsAdded: order.credit_plans.credit_amount,
            amount: order.total_price,
            currency: order.currency,
            stripePaymentIntentId: paymentIntent.id
        });

        console.log(`Payment succeeded for order ${orderId}`);

    } catch (error) {
        console.error('Error processing payment success:', error);
    }
}

async function handlePaymentIntentFailed(paymentIntent) {
    const { orderId } = paymentIntent.metadata;

    if (!orderId) {
        console.error('No orderId in payment intent metadata');
        return;
    }

    try {
        // Update order status to failed
        const { error } = await supabase
            .from("credit_orders")
            .update({
                status: 'failed',
                payment_reference: paymentIntent.id,
                payment_provider: 'stripe',
                updated_at: new Date(),
            })
            .eq('id', orderId);

        if (error) {
            throw error;
        }

        console.log(`Payment failed for order ${orderId}`);

    } catch (error) {
        console.error('Error processing payment failure:', error);
    }
}

async function handleCheckoutSessionCompleted(session) {
    const { orderId, planId } = session.metadata;

    if (!orderId) {
        console.error('No orderId in checkout session metadata');
        return;
    }

    try {
        // Check if order was already processed to prevent duplicate processing
        const { data: existingOrder, error: checkError } = await supabase
            .from("credit_orders")
            .select('id, status')
            .eq('id', orderId)
            .single();

        if (checkError || !existingOrder) {
            console.error('Failed to fetch order details for checkout session');
            return;
        }

        if (existingOrder.status === 'paid') {
            console.log(`Order ${orderId} already processed from checkout session, skipping`);
            return;
        }

        // Update order status to paid
        const { error: orderError } = await supabase
            .from("credit_orders")
            .update({
                status: 'paid',
                payment_reference: session.id,
                payment_provider: 'stripe',
                paid_at: new Date(),
                updated_at: new Date(),
            })
            .eq('id', orderId);

        if (orderError) {
            throw orderError;
        }

        console.log(`Checkout session completed for order ${orderId}`);

        // Note: For checkout sessions, the payment_intent.succeeded event will handle
        // the credit processing, transaction creation, and invoice generation
        // This prevents duplicate processing

    } catch (error) {
        console.error('Error processing checkout session completion:', error);
    }
}
