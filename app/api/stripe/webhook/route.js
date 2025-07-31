import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Common function to process payment success (credits, transactions, invoices)
async function processPaymentSuccess(order, paymentReference, source = 'payment_intent') {
    try {
        // Extract credit plan data (handle both array and object formats)
        const creditPlan = Array.isArray(order.credit_plans) ? order.credit_plans[0] : order.credit_plans;

        if (!creditPlan || !creditPlan.credit_amount) {
            console.error('❌ Credit plan data not found in order:', order);
            throw new Error('Credit plan data missing');
        }

        // Get current credits to add to them instead of replacing
        const { data: currentCredits } = await supabase
            .from("business_credits")
            .select('total_credits, used_credits')
            .eq('business_user_id', order.business_user_id)
            .single();

        const currentTotalCredits = currentCredits?.total_credits || 0;
        const currentUsedCredits = currentCredits?.used_credits || 0;
        const newTotalCredits = currentTotalCredits + creditPlan.credit_amount;

        // Add credits to user account (add to existing, don't replace)
        const { error: creditsError } = await supabase
            .from("business_credits")
            .upsert({
                business_user_id: order.business_user_id,
                total_credits: newTotalCredits,
                used_credits: currentUsedCredits,
                updated_at: new Date(),
            }, {
                onConflict: 'business_user_id',
                ignoreDuplicates: false,
            });

        if (creditsError) {
            console.error('❌ Failed to update user credits:', creditsError);
        } 

        // Create credit transaction record (check for duplicates first)
        const { data: existingTransactions } = await supabase
            .from("credit_transactions")
            .select('id')
            .eq('order_id', order.id)
            .eq('business_user_id', order.business_user_id)
            .eq('type', 'top_up');

        const existingTransaction = existingTransactions && existingTransactions.length > 0 ? existingTransactions[0] : null;

        if (!existingTransaction) {
            const { error: transactionError } = await supabase
                .from("credit_transactions")
                .insert({
                    business_user_id: order.business_user_id,
                    order_id: order.id,
                    type: 'top_up',
                    credit_change: creditPlan.credit_amount,
                    balance_after: newTotalCredits,
                    description: `Credit purchase - ${creditPlan.name}`,
                    created_at: new Date(),
                });

            if (transactionError) {
                console.error('❌ Failed to create credit transaction:', transactionError);
            } 
        } 

        // Get business profile details for invoice
        const { data: businessProfile } = await supabase
            .from("business_profiles")
            .select('company_name, company_address')
            .eq('business_id', order.business_user_id)
            .single();

        // Create invoice record (check for duplicates first)
        const { data: existingInvoices } = await supabase
            .from("invoices")
            .select('id')
            .eq('order_id', order.id);

        const existingInvoice = existingInvoices && existingInvoices.length > 0 ? existingInvoices[0] : null;

        if (!existingInvoice) {
            const invoiceNumber = `INV-${Date.now()}-${order.id.slice(-8)}`;

            const invoiceData = {
                business_user_id: order.business_user_id,
                order_id: order.id,
                invoice_number: invoiceNumber,
                amount: order.total_price,
                currency: order.currency,
                status: 'paid',
                business_name: businessProfile?.company_name || 'EduSocial Business',
                business_tax_id: '', // Tax ID not stored in current schema
                billing_address: businessProfile?.company_address || '',
                issued_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
            };

            const { error: invoiceError } = await supabase
                .from("invoices")
                .insert(invoiceData);

            if (invoiceError) {
                console.error('❌ Failed to create invoice:', invoiceError);
            } 
        } 

    } catch (error) {
        console.error(`❌ Error processing payment success for order ${order.id}:`, error);
        throw error;
    }
}

export async function POST(request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
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
            case 'payment_intent.canceled':
                await handlePaymentIntentCanceled(event.data.object);
                break;
            case 'payment_intent.requires_action':
                await handlePaymentIntentRequiresAction(event.data.object);
                break;
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'checkout.session.expired':
                await handleCheckoutSessionExpired(event.data.object);
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
    const { orderId, planId, userId } = paymentIntent.metadata;

    if (!orderId) {
        console.error('❌ No orderId in payment intent metadata');
        return;
    }

    try {
        // First, check if order was already processed to prevent duplicate credit processing
        const { data: existingOrder, error: checkError } = await supabase
            .from("credit_orders")
            .select(`
                id, business_user_id, plan_id, total_price, currency, status,
                credit_plans!inner(id, credit_amount, name)
            `)
            .eq('id', orderId)
            .single();

        if (checkError || !existingOrder) {
            console.error('❌ Failed to fetch order details:', checkError);
            throw new Error('Failed to fetch order details');
        }

        if (existingOrder.status === 'paid') {
            return;
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
            console.error('❌ Failed to update order status:', orderError);
            throw orderError;
        }

        // Use the order data we already fetched and process payment success
        await processPaymentSuccess(existingOrder, paymentIntent.id, 'payment_intent');
    } catch (error) {
        console.error('❌ Error processing payment success:', error);
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

    } catch (error) {
        console.error('Error processing payment failure:', error);
    }
}

async function handlePaymentIntentCanceled(paymentIntent) {
    const { orderId } = paymentIntent.metadata;

    if (!orderId) {
        console.error('No orderId in payment intent metadata');
        return;
    }

    try {
        // Update order status to cancelled
        const { error } = await supabase
            .from("credit_orders")
            .update({
                status: 'cancelled',
                payment_reference: paymentIntent.id,
                payment_provider: 'stripe',
                updated_at: new Date(),
            })
            .eq('id', orderId);

        if (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error processing payment intent cancellation:', error);
    }
}

async function handlePaymentIntentRequiresAction(paymentIntent) {
    const { orderId } = paymentIntent.metadata;

    if (!orderId) {
        console.error('No orderId in payment intent metadata');
        return;
    }

    try {
        // Update order status to pending (waiting for user action)
        const { error } = await supabase
            .from("credit_orders")
            .update({
                status: 'pending',
                payment_reference: paymentIntent.id,
                payment_provider: 'stripe',
                updated_at: new Date(),
            })
            .eq('id', orderId);

        if (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error processing payment intent requires action:', error);
    }
}

async function handleCheckoutSessionExpired(session) {
    const { orderId } = session.metadata;

    if (!orderId) {
        console.error('No orderId in checkout session metadata');
        return;
    }

    try {
        // Update order status to cancelled due to expiration
        const { error } = await supabase
            .from("credit_orders")
            .update({
                status: 'cancelled',
                payment_reference: session.id,
                payment_provider: 'stripe',
                updated_at: new Date(),
            })
            .eq('id', orderId);

        if (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error processing checkout session expiration:', error);
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

        // Get order details with plan information for credit processing
        const { data: order, error: orderFetchError } = await supabase
            .from("credit_orders")
            .select(`
                id, business_user_id, total_price, currency,
                credit_plans!inner(id, name, credit_amount)
            `)
            .eq('id', orderId)
            .single();

        if (orderFetchError || !order) {
            console.error('Failed to fetch order details for checkout session:', orderFetchError);
            return;
        }

        // Process credits, transactions, and invoices (same as payment_intent.succeeded)
        await processPaymentSuccess(order, session.id, 'checkout_session');

    } catch (error) {
        console.error('Error processing checkout session completion:', error);
    }
}
