import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Import the processPaymentSuccess function from webhook
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

        // Create credit transaction record with enhanced duplicate prevention
        // Use payment_reference as additional unique constraint to prevent race conditions
        const { data: existingTransactions } = await supabase
            .from("credit_transactions")
            .select('id')
            .eq('order_id', order.id)
            .eq('business_user_id', order.business_user_id)
            .eq('type', 'top_up');

        const existingTransaction = existingTransactions && existingTransactions.length > 0 ? existingTransactions[0] : null;

        if (!existingTransaction) {
            // Add a small delay to reduce race condition probability
            await new Promise(resolve => setTimeout(resolve, 100));

            // Double-check for duplicates after delay
            const { data: doubleCheckTransactions } = await supabase
                .from("credit_transactions")
                .select('id')
                .eq('order_id', order.id)
                .eq('business_user_id', order.business_user_id)
                .eq('type', 'top_up');

            if (!doubleCheckTransactions || doubleCheckTransactions.length === 0) {
                const { error: transactionError } = await supabase
                    .from("credit_transactions")
                    .insert({
                        business_user_id: order.business_user_id,
                        order_id: order.id,
                        type: 'top_up',
                        credit_change: creditPlan.credit_amount,
                        balance_after: newTotalCredits,
                        description: `Credit purchase - ${creditPlan.name} (API)`,
                        created_at: new Date(),
                    });

                if (transactionError) {
                    console.error('❌ Failed to create credit transaction:', transactionError);
                    // Don't throw error as this is not critical for payment success
                } else {
                    console.log('✅ Credit transaction created via API');
                }
            } else {
                console.log('✅ Credit transaction already exists (detected in double-check)');
            }
        } else {
            console.log('✅ Credit transaction already exists');
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
    try {
        const requestData = await request.json();
        const { 
            paymentIntentId, 
            paymentMethodId, 
            paymentMethodType,
            returnUrl 
        } = requestData;

        // Get user session for authentication
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { user } = session;

        // Validate required parameters
        if (!paymentIntentId) {
            return NextResponse.json({
                error: "Missing required parameter: paymentIntentId"
            }, { status: 400 });
        }

        // Retrieve the payment intent to verify ownership
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (!paymentIntent) {
            return NextResponse.json({
                error: "Payment intent not found"
            }, { status: 404 });
        }

        // Verify the payment intent belongs to the current user
        if (paymentIntent.metadata.userId !== user.id) {
            return NextResponse.json({
                error: "Unauthorized access to payment intent"
            }, { status: 403 });
        }

        let confirmationResult;

        // Handle different payment method types
        switch (paymentMethodType) {
            case 'card':
                // For card payments, confirm with payment method
                if (!paymentMethodId) {
                    return NextResponse.json({
                        error: "Payment method ID required for card payments"
                    }, { status: 400 });
                }
                
                confirmationResult = await stripe.paymentIntents.confirm(paymentIntentId, {
                    payment_method: paymentMethodId,
                    return_url: returnUrl
                });
                break;

            case 'alipay':
                // For Alipay, confirm with redirect - create payment method on-the-fly
                confirmationResult = await stripe.paymentIntents.confirm(paymentIntentId, {
                    payment_method_data: {
                        type: 'alipay'
                    },
                    return_url: returnUrl
                });
                break;

            case 'grabpay':
                // For GrabPay, confirm with redirect - create payment method on-the-fly
                confirmationResult = await stripe.paymentIntents.confirm(paymentIntentId, {
                    payment_method_data: {
                        type: 'grabpay'
                    },
                    return_url: returnUrl
                });
                break;

            case 'google_pay':
                // For Google Pay, confirm with payment method
                if (!paymentMethodId) {
                    return NextResponse.json({
                        error: "Payment method ID required for Google Pay"
                    }, { status: 400 });
                }
                
                confirmationResult = await stripe.paymentIntents.confirm(paymentIntentId, {
                    payment_method: paymentMethodId,
                    return_url: returnUrl
                });
                break;

            default:
                return NextResponse.json({
                    error: `Unsupported payment method type: ${paymentMethodType}`
                }, { status: 400 });
        }

        // Update order status based on payment intent status
        const orderId = paymentIntent.metadata.orderId;
        if (orderId) {
            let orderStatus = 'pending';

            if (confirmationResult.status === 'succeeded') {
                orderStatus = 'paid';

                // Get order details with plan information for processing
                const { data: order, error: orderFetchError } = await supabase
                    .from("credit_orders")
                    .select(`
                        id, business_user_id, plan_id, total_price, currency, status,
                        credit_plans!inner(id, credit_amount, name)
                    `)
                    .eq('id', orderId)
                    .single();

                if (orderFetchError || !order) {
                    console.error('❌ Failed to fetch order details for payment processing:', orderFetchError);
                } else {
                    // Update order status first
                    const { error: updateError } = await supabase
                        .from("credit_orders")
                        .update({
                            status: orderStatus,
                            payment_reference: confirmationResult.id,
                            payment_provider: 'stripe',
                            paid_at: new Date(),
                            updated_at: new Date(),
                        })
                        .eq('id', orderId);

                    if (updateError) {
                        console.error('❌ Failed to update order status:', updateError);
                    } else {
                        // Process payment success (credits, transactions, invoices)
                        try {
                            await processPaymentSuccess(order, confirmationResult.id, 'confirm_payment');
                        } catch (processError) {
                            console.error('❌ Error in payment success processing:', processError);
                        }
                    }
                }
            } else if (confirmationResult.status === 'requires_action') {
                orderStatus = 'pending'; // Keep as pending for redirect flows
            } else if (confirmationResult.status === 'canceled') {
                orderStatus = 'cancelled';
            } else if (confirmationResult.status === 'payment_failed') {
                orderStatus = 'failed';
            }

            // For non-succeeded statuses, just update the order status
            if (confirmationResult.status !== 'succeeded') {
                const { error: updateError } = await supabase
                    .from("credit_orders")
                    .update({
                        status: orderStatus,
                        payment_reference: confirmationResult.id,
                        payment_provider: 'stripe',
                        updated_at: new Date(),
                    })
                    .eq('id', orderId);

                if (updateError) {
                    console.error('❌ Failed to update order status:', updateError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            payment_intent: {
                id: confirmationResult.id,
                status: confirmationResult.status,
                client_secret: confirmationResult.client_secret,
                next_action: confirmationResult.next_action
            }
        });

    } catch (error) {
        console.error('Error confirming payment:', error);
        
        // Handle specific Stripe errors
        if (error.type === 'StripeCardError') {
            return NextResponse.json({
                error: error.message,
                type: 'card_error'
            }, { status: 400 });
        }
        
        if (error.type === 'StripeInvalidRequestError') {
            return NextResponse.json({
                error: error.message,
                type: 'invalid_request'
            }, { status: 400 });
        }

        return NextResponse.json({ 
            error: "Failed to confirm payment",
            type: 'api_error'
        }, { status: 500 });
    }
}
