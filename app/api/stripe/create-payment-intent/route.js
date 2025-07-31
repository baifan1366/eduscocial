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
        const { orderId, paymentMethodTypes } = requestData;

        // Get user session for authentication
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { user } = session;

        // Validate required parameters - only orderId is required now
        if (!orderId) {
            return NextResponse.json({
                error: "Missing required parameter: orderId"
            }, { status: 400 });
        }

        // Fetch order with plan details in a single query
        const { data: order, error: orderError } = await supabase
            .from("credit_orders")
            .select(`
                id, business_user_id, plan_id, total_price, currency, status,
                credit_plans!inner(id, name, original_price, discount_price, is_discounted, currency)
            `)
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

        // Extract plan data from the joined result
        const plan = order.credit_plans;
        if (!plan) {
            return NextResponse.json({
                error: "Plan not found"
            }, { status: 404 });
        }

        // Calculate amount from plan price (convert to cents and ensure integer)
        const priceInDollars = plan.is_discounted ? plan.discount_price : plan.original_price;
        const amount = Math.round(priceInDollars * 100);

        // Map currency codes to Stripe-supported currencies
        const currencyMapping = {
            'rm': 'myr',  // Malaysian Ringgit
            'usd': 'usd', // US Dollar
            'eur': 'eur', // Euro
            'gbp': 'gbp', // British Pound
            // Add more mappings as needed
        };

        const stripeCurrency = currencyMapping[plan.currency.toLowerCase()] || 'usd';

        // Filter payment method types based on currency
        const supportedPaymentMethods = filterPaymentMethodsByCurrency(paymentMethodTypes || ['card'], stripeCurrency);

        // Create payment intent with digital wallet configurations
        const paymentIntentConfig = {
            amount: amount,
            currency: stripeCurrency,
            payment_method_types: supportedPaymentMethods,
            metadata: {
                orderId: orderId,
                planId: plan.id,
                userId: user.id,
            },
            description: `EduSocial Credits - Order ID: ${orderId}`,
        };

        // Add specific configurations for digital wallets
        if (supportedPaymentMethods.includes('apple_pay')) {
            paymentIntentConfig.payment_method_options = {
                ...paymentIntentConfig.payment_method_options,
                apple_pay: {
                    request_three_d_secure: 'automatic',
                },
            };
        }

        if (supportedPaymentMethods.includes('alipay')) {
            paymentIntentConfig.payment_method_options = {
                ...paymentIntentConfig.payment_method_options,
                alipay: {
                    // Alipay specific options can be added here
                },
            };
        }

        if (supportedPaymentMethods.includes('grabpay')) {
            paymentIntentConfig.payment_method_options = {
                ...paymentIntentConfig.payment_method_options,
                grabpay: {
                    // GrabPay specific options can be added here
                },
            };
        }

        if (supportedPaymentMethods.includes('google_pay')) {
            paymentIntentConfig.payment_method_options = {
                ...paymentIntentConfig.payment_method_options,
                google_pay: {
                    // Google Pay specific options can be added here
                },
            };
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

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

// Helper function to filter payment methods based on currency
function filterPaymentMethodsByCurrency(paymentMethodTypes, currency) {
    const supportedMethods = {
        'myr': ['card', 'fpx', 'grabpay', 'alipay', 'apple_pay', 'google_pay'],
        'sgd': ['card', 'grabpay', 'alipay', 'apple_pay', 'google_pay'],
        'thb': ['card', 'grabpay', 'alipay', 'apple_pay', 'google_pay'],
        'usd': ['card', 'us_bank_account', 'alipay', 'apple_pay', 'google_pay', 'cashapp'],
        'eur': ['card', 'sepa_debit', 'sofort', 'ideal', 'alipay', 'apple_pay', 'google_pay'],
        'gbp': ['card', 'bacs_debit', 'alipay', 'apple_pay', 'google_pay'],
        'cad': ['card', 'acss_debit', 'alipay', 'apple_pay', 'google_pay'],
        'aud': ['card', 'au_becs_debit', 'alipay', 'apple_pay', 'google_pay'],
    };

    const currencyMethods = supportedMethods[currency] || ['card', 'alipay', 'apple_pay', 'google_pay'];

    // Filter requested methods to only include those supported by the currency
    return paymentMethodTypes.filter(method => currencyMethods.includes(method));
}
