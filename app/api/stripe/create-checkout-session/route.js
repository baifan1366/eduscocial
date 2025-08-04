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
                credit_plans!inner(id, name, original_price, discount_price, is_discounted, currency, credit_amount)
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

        // Generate success and cancel URLs using query parameters
        const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_URL;
        const successUrl = `${baseUrl}/business/payments-and-credits/buy-credits/checkout?orderId=${orderId}&status=success`;
        const cancelUrl = `${baseUrl}/business/payments-and-credits/buy-credits/checkout?orderId=${orderId}&status=cancel`;

        // Map currency codes to Stripe-supported currencies
        const currencyMapping = {
            'rm': 'myr',  // Malaysian Ringgit
            'usd': 'usd', // US Dollar
            'eur': 'eur', // Euro
            'gbp': 'gbp', // British Pound
            // Add more mappings as needed
        };

        const stripeCurrency = currencyMapping[plan.currency.toLowerCase()] || 'usd';

        // Filter payment method types based on currency and region
        const supportedPaymentMethods = filterPaymentMethodsByCurrency(paymentMethodTypes || ['card'], stripeCurrency);

        // Create checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: supportedPaymentMethods,
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: stripeCurrency,
                        product_data: {
                            name: `EduSocial Credits - ${plan.name}`,
                            description: `${plan.credit_amount} credits`,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                orderId: orderId,
                planId: plan.id,
                userId: user.id,
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        // Update order with checkout session ID
        const { error: updateError } = await supabase
            .from("credit_orders")
            .update({
                payment_reference: checkoutSession.id,
                payment_provider: 'stripe',
                updated_at: new Date(),
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Failed to update order with checkout session:', updateError);
            // Continue anyway, as checkout session was created successfully
        }

        return NextResponse.json({
            success: true,
            checkout_session_id: checkoutSession.id,
            checkout_url: checkoutSession.url,
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({ 
            error: "Failed to create checkout session" 
        }, { status: 500 });
    }
}

// Helper function to filter payment methods based on currency and environment
function filterPaymentMethodsByCurrency(paymentMethodTypes, currency) {
    // Detect if we're in test mode based on the Stripe key
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');

    const supportedMethods = {
        'myr': ['card', 'fpx', 'grabpay', 'alipay'],
        'sgd': ['card', 'grabpay', 'alipay'],
        'thb': ['card', 'grabpay', 'alipay'],
        'usd': ['card', 'us_bank_account', 'alipay'],
        'eur': ['card', 'sepa_debit', 'sofort', 'ideal', 'alipay'],
        'gbp': ['card', 'bacs_debit', 'alipay'],
        'cad': ['card', 'acss_debit', 'alipay'],
        'aud': ['card', 'au_becs_debit', 'alipay'],
    };

    // Payment methods that require activation in live mode
    const requiresActivation = ['alipay', 'grabpay', 'fpx', 'us_bank_account', 'sepa_debit', 'sofort', 'ideal', 'bacs_debit', 'acss_debit', 'au_becs_debit'];

    const currencyMethods = supportedMethods[currency.toLowerCase()] || ['card'];

    // Filter requested methods to only include those supported by the currency
    let filteredMethods = paymentMethodTypes.filter(method => currencyMethods.includes(method));

    // In live mode, filter out methods that require activation but might not be activated
    if (!isTestMode) {
        console.log('🔴 Live mode detected in checkout session - some payment methods may require activation');
        const potentiallyUnavailable = filteredMethods.filter(method => requiresActivation.includes(method));
        if (potentiallyUnavailable.length > 0) {
            console.log('⚠️ Payment methods that may need activation:', potentiallyUnavailable);
        }
    }

    return filteredMethods;
}
