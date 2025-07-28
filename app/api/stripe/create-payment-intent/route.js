import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Debug: Check if Stripe key is available
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY environment variable is not set');
}

export async function POST(request) {
    try {
        const requestData = await request.json();
        const { orderId, planId, amount, userId } = requestData;

        // Get user session for authentication
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { user } = session;

        // Validate required parameters
        if (!orderId || !planId || !amount) {
            return NextResponse.json({
                error: "Missing required parameters: orderId, planId, amount"
            }, { status: 400 });
        }

        // Fetch and validate the order
        const { data: order, error: orderError } = await supabase
            .from("credit_orders")
            .select('id, business_user_id, plan_id, total_price, currency, status')
            .eq('id', orderId)
            .eq('business_user_id', user.id) // Ensure order belongs to current user
            .single();

        if (orderError || !order) {
            return NextResponse.json({
                error: "Order not found or unauthorized"
            }, { status: 404 });
        }

        // Validate order status
        if (order.status !== 'pending') {
            return NextResponse.json({ 
                error: "Order is not in pending status" 
            }, { status: 400 });
        }

        // Validate plan ID matches
        if (order.plan_id !== planId) {
            return NextResponse.json({ 
                error: "Plan ID mismatch" 
            }, { status: 400 });
        }

        // Fetch plan details for additional validation
        const { data: plan, error: planError } = await supabase
            .from("credit_plans")
            .select('id, original_price, discount_price, is_discounted, currency')
            .eq('id', planId)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ 
                error: "Plan not found" 
            }, { status: 404 });
        }

        // Validate amount matches plan price
        const expectedAmount = plan.is_discounted ? 
            plan.discount_price * 100 : 
            plan.original_price * 100;

        if (amount !== expectedAmount) {
            return NextResponse.json({ 
                error: "Amount mismatch with plan price" 
            }, { status: 400 });
        }

        // Map currency codes to Stripe-supported currencies
        const currencyMapping = {
            'rm': 'myr',  // Malaysian Ringgit
            'usd': 'usd', // US Dollar
            'eur': 'eur', // Euro
            'gbp': 'gbp', // British Pound
            // Add more mappings as needed
        };

        const stripeCurrency = currencyMapping[plan.currency.toLowerCase()] || 'usd';

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: stripeCurrency,
            metadata: {
                orderId: orderId,
                planId: planId,
                userId: user.id,
            },
            description: `EduSocial Credits - Order ID: ${orderId}`,
        });

        // Update order with payment intent ID
        const { error: updateError } = await supabase
            .from("credit_orders")
            .update({
                payment_reference: paymentIntent.id,
                payment_provider: 'stripe',
                updated_at: new Date(),
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Failed to update order with payment intent:', updateError);
            // Continue anyway, as payment intent was created successfully
        }

        return NextResponse.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
        });

    } catch (error) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json({ 
            error: "Failed to create payment intent" 
        }, { status: 500 });
    }
}
