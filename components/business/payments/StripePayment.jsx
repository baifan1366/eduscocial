'use client';

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useCheckout, { useCheckoutContext } from "@/hooks/business/payments/useCheckout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { Lock, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Card Element styling
const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
            fontFamily: 'system-ui, -apple-system, sans-serif',
        },
        invalid: {
            color: '#9e2146',
        },
    },
    hidePostalCode: false,
};

// Payment Form Component that uses Stripe Elements
function PaymentForm({ clientSecret, orderInfo, planInfo, onPaymentSuccess, onPaymentError }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [cardComplete, setCardComplete] = useState(false);
    const t = useTranslations('Checkout');
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setIsProcessing(true);
        setPaymentError(null);

        const cardElement = elements.getElement(CardElement);

        try {
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: orderInfo?.business_user_id || 'Customer',
                    },
                },
            });

            if (error) {
                console.error('Payment failed:', error);
                setPaymentError(error.message);
                onPaymentError?.(error);
            } else if (paymentIntent.status === 'succeeded') {
                console.log('Payment succeeded:', paymentIntent);
                onPaymentSuccess?.(paymentIntent);
                // Redirect to success page
                router.push(`/business/payments-and-credits/buy-credits/checkout?status=success&orderId=${orderInfo.id}`);
            }
        } catch (err) {
            console.error('Payment error:', err);
            setPaymentError('An unexpected error occurred. Please try again.');
            onPaymentError?.(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCardChange = (event) => {
        setCardComplete(event.complete);
        if (event.error) {
            setPaymentError(event.error.message);
        } else {
            setPaymentError(null);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="p-4 border rounded-lg bg-white">
                <div className="flex items-center mb-3">
                    <CreditCard className="w-4 h-4 mr-2 text-gray-600" />
                    <p className="text-sm font-medium text-gray-700">Card Information</p>
                </div>
                <div className="p-3 border rounded border-gray-300 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
                    <CardElement
                        options={cardElementOptions}
                        onChange={handleCardChange}
                    />
                </div>
            </div>

            {paymentError && (
                <div className="flex items-center p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {paymentError}
                </div>
            )}

            <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                disabled={!stripe || !cardComplete || isProcessing}
            >
                {isProcessing ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        {t('processing')}
                    </div>
                ) : (
                    <>
                        {t('payNow')} {planInfo && (
                            `${planInfo.currency.toUpperCase()} ${planInfo.is_discounted ? planInfo.discount_price : planInfo.original_price}`
                        )}
                    </>
                )}
            </Button>
        </form>
    );
}

export default function StripePayment() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    const t = useTranslations('Checkout');
    const [isLoading, setIsLoading] = useState(true);
    const [clientSecret, setClientSecret] = useState(null);
    const [paymentIntentId, setPaymentIntentId] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);

    // Use CheckoutContext to get order and plan info with safe defaults
    let checkoutContext;
    try {
        checkoutContext = useCheckoutContext();
    } catch (error) {
        console.error('CheckoutContext not available in StripePayment:', error);
        checkoutContext = {
            orderInfo: null,
            planInfo: null,
            status: 'error',
            error: 'CheckoutProvider not configured'
        };
    }

    const { orderInfo, planInfo, status: checkoutStatus = 'loading', error: checkoutError } = checkoutContext;
    const { data, mutate: checkout } = useCheckout();

    // Debug logging to help identify the issue
    useEffect(() => {
        console.log('StripePayment Debug:', {
            checkoutStatus,
            orderInfo,
            planInfo,
            checkoutError,
            status,
            isLoading
        });
    }, [checkoutStatus, orderInfo, planInfo, checkoutError, status, isLoading]);

    // Create payment intent when order and plan are ready
    useEffect(() => {
        if (checkoutStatus === 'ready' && orderInfo && planInfo && !clientSecret && !status) {
            createPaymentIntent();
        }
    }, [checkoutStatus, orderInfo, planInfo, clientSecret, status]);

    const createPaymentIntent = async () => {
        try {
            setIsLoading(true);
            const amount = planInfo.is_discounted ?
                planInfo.discount_price * 100 :
                planInfo.original_price * 100;

            const response = await fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderInfo.id,
                    planId: planInfo.id,
                    amount: amount,
                    userId: orderInfo.business_user_id,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setClientSecret(data.client_secret);
                setPaymentIntentId(data.payment_intent_id);
            } else {
                console.error('Failed to create payment intent:', data.error);
                setPaymentStatus('error');
            }
        } catch (error) {
            console.error('Error creating payment intent:', error);
            setPaymentStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentSuccess = (paymentIntent) => {
        console.log('Payment successful:', paymentIntent);
        setPaymentStatus('success');
    };

    const handlePaymentError = (error) => {
        console.error('Payment failed:', error);
        setPaymentStatus('error');
    };
    
    // 显示支付状态
    if (status === 'success' || status === 'cancel') {
        const currentStatus = status;
        
        return (
            <Card className="w-full h-full flex flex-col">
                <CardHeader>
                    <CardTitle>{t('paymentDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="flex flex-col items-center justify-center h-full">
                        {currentStatus === 'success' ? (
                            <div className="text-center space-y-4">
                                <div className="text-green-500 text-4xl flex justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-xl">{t('paymentProcessed')}</p>
                                {planInfo ? (
                                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                                        <h3 className="font-bold mb-2">{t('orderSummary')}</h3>
                                        <div className="flex justify-between">
                                            <span>{t('credits')}:</span>
                                            <span>{planInfo.credit_amount || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('total')}:</span>
                                            <span className="font-bold">
                                                {planInfo.currency || 'RM'} {planInfo.is_discounted ? (planInfo.discount_price || 0) : (planInfo.original_price || 0)}
                                            </span>
                                        </div>
                                    </div>
                                ) : orderInfo ? (
                                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                                        <h3 className="font-bold mb-2">{t('orderSummary')}</h3>
                                        <div className="flex justify-between">
                                            <span>{t('total')}:</span>
                                            <span className="font-bold">
                                                {orderInfo.currency || 'RM'} {orderInfo.total_price || 0}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">
                                            Order ID: {orderInfo.id}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-yellow-500">
                                        {t('orderDetailsNotAvailable')}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="text-red-500 text-4xl flex justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-xl">{t('paymentCancelled')}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader>
                <CardTitle>{t('paymentDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                        <p className="mt-4">{t('loadingPayment')}</p>
                    </div>
                ) : clientSecret ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <Image
                                    src="/stripe-logo.jpeg"
                                    alt="Stripe"
                                    width={120}
                                    height={40}
                                    style={{
                                        width: '120px',
                                        height: '40px',
                                    }}
                                    priority
                                />
                            </div>
                            <p className="text-lg font-semibold mb-2">{t('securePayment')}</p>
                            <div className="flex items-center justify-center text-sm text-gray-600">
                                <Lock className="w-4 h-4 mr-1" />
                                {t('securePaymentDescription')}
                            </div>
                        </div>

                        {/* Stripe Elements Payment Form */}
                        <div className="w-full">
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <PaymentForm
                                    clientSecret={clientSecret}
                                    orderInfo={orderInfo}
                                    planInfo={planInfo}
                                    onPaymentSuccess={handlePaymentSuccess}
                                    onPaymentError={handlePaymentError}
                                />
                            </Elements>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <Image
                                    src="/stripe-logo.jpeg"
                                    alt="Stripe"
                                    width={120}
                                    height={40}
                                    style={{
                                        width: '120px',
                                        height: '40px',
                                    }}
                                    priority
                                />
                            </div>
                            <p className="text-lg font-bold">{t('clickProceed')}</p>
                            <p className="text-sm mt-2 text-gray-500">
                                {checkoutStatus === 'loading' ? 'Loading order data...' : 'Waiting for payment setup...'}
                            </p>
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                            <Lock className="mr-1" />
                            <span>{t('securePayment')}</span>
                        </div>

                        <div className="flex gap-2">
                            <Image src="/visa.webp" alt="Visa" width={40} height={25} style={{
                                width: '40px',
                                height: '25px',
                            }} />
                            <Image src="/mastercard.webp" alt="Mastercard" width={40} height={25} style={{
                                width: '40px',
                                height: '25px',
                            }} />
                            <Image src="/alipay.webp" alt="Alipay" width={40} height={25} style={{
                                width: '40px',
                                height: '25px',
                            }} />
                            <Image src="/apple-pay.webp" alt="Apple Pay" width={40} height={25} style={{
                                width: '40px',
                                height: '25px',
                            }} />
                            <Image src="/google-pay.webp" alt="Google Pay" width={40} height={25} style={{
                                width: '40px',
                                height: '25px',
                            }} />
                            <Image src="/grab-pay.png" alt="GrabPay" width={40} height={25} style={{
                                width: '40px',
                                height: '25px',
                            }} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 