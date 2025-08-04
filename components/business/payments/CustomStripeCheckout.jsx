'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from 'next-intl';
import { CreditCard, Smartphone, Globe, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import useStripePaymentIntent from "@/hooks/business/payments/useStripePaymentIntent";
import useStripeConfirmPayment, { useStripePaymentStatus } from "@/hooks/business/payments/useStripeConfirmPayment";
import { useCheckoutContext } from "@/hooks/business/payments/useCheckout";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Payment method configurations
const PAYMENT_METHODS = {
    card: {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Visa, Mastercard, American Express',
        icon: CreditCard,
        type: 'direct',
        stripeType: 'card'
    },
    alipay: {
        id: 'alipay',
        name: 'Alipay',
        description: 'Pay with your Alipay account',
        icon: Smartphone,
        type: 'redirect',
        stripeType: 'alipay'
    },
    grabpay: {
        id: 'grabpay',
        name: 'GrabPay',
        description: 'Pay with your GrabPay wallet',
        icon: Smartphone,
        type: 'redirect',
        stripeType: 'grabpay'
    },
    google_pay: {
        id: 'google_pay',
        name: 'Google Pay',
        description: 'Pay with Google Pay',
        icon: Globe,
        type: 'direct',
        stripeType: 'google_pay'
    }
};

// Card element styling
const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
    },
    hidePostalCode: false,
};

function PaymentForm({ 
    selectedMethod, 
    onPaymentSuccess, 
    onPaymentError, 
    clientSecret, 
    paymentIntentId,
    orderId 
}) {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const t = useTranslations('Checkout');
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    
    const { mutate: confirmPayment } = useStripeConfirmPayment();

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setIsProcessing(true);
        setPaymentError(null);

        try {
            const method = PAYMENT_METHODS[selectedMethod];
            const returnUrl = `${window.location.origin}/business/payments-and-credits/buy-credits/checkout?orderId=${orderId}&status=success`;

            let paymentMethodId = null;

            // For card payments, create payment method from card element
            if (method.type === 'direct' && selectedMethod === 'card') {
                const cardElement = elements.getElement(CardElement);

                const { error, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardElement,
                });

                if (error) {
                    throw new Error(error.message);
                }

                paymentMethodId = paymentMethod.id;
            }

            // For Google Pay, we'll handle it differently using Payment Request API
            if (selectedMethod === 'google_pay') {
                // Google Pay will be handled by PaymentRequestButtonElement
                // This case shouldn't be reached as Google Pay uses its own button
                throw new Error('Google Pay should use the Payment Request Button');
            }

            // Confirm payment using our API
            confirmPayment({
                paymentIntentId,
                paymentMethodId,
                paymentMethodType: method.stripeType,
                returnUrl,
                orderId
            }, {
                onSuccess: (data) => {
                    if (data.success) {
                        const paymentIntent = data.payment_intent;
                        
                        if (paymentIntent.status === 'succeeded') {
                            onPaymentSuccess?.(paymentIntent);
                        } else if (paymentIntent.next_action) {
                            // Handle redirect for Alipay/GrabPay
                            if (paymentIntent.next_action.type === 'redirect_to_url') {
                                window.location.href = paymentIntent.next_action.redirect_to_url.url;
                            }
                        }
                    } else {
                        throw new Error(data.error || 'Payment confirmation failed');
                    }
                },
                onError: (error) => {
                    console.error('Payment confirmation error:', error);
                    setPaymentError(error.message);
                    onPaymentError?.(error);
                }
            });

        } catch (error) {
            console.error('Payment error:', error);
            setPaymentError(error.message);
            onPaymentError?.(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const method = PAYMENT_METHODS[selectedMethod];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Method Specific UI */}
            {selectedMethod === 'card' && (
                <div className="space-y-2">
                    <Label htmlFor="card-element">Card Details</Label>
                    <div className="border rounded-md p-3 bg-white">
                        <CardElement 
                            id="card-element"
                            options={cardElementOptions}
                        />
                    </div>
                </div>
            )}

            {method.type === 'redirect' && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        You will be redirected to {method.name} to complete your payment.
                    </AlertDescription>
                </Alert>
            )}

            {/* Error Display */}
            {paymentError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{paymentError}</AlertDescription>
                </Alert>
            )}

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                disabled={!stripe || isProcessing}
                variant="orange"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('processing')}
                    </>
                ) : (
                    `Pay with ${method.name}`
                )}
            </Button>
        </form>
    );
}

function GooglePayButton({
    onPaymentSuccess,
    onPaymentError,
    clientSecret,
    paymentIntentId,
    orderId,
    planInfo
}) {
    const stripe = useStripe();
    const [paymentRequest, setPaymentRequest] = useState(null);

    useEffect(() => {
        if (stripe && planInfo) {
            // Map currency codes to Stripe Payment Request API supported currencies
            const currencyMapping = {
                'rm': 'myr',   // Malaysian Ringgit
                'RM': 'myr',   // Malaysian Ringgit (uppercase)
                'myr': 'myr',  // Malaysian Ringgit (already correct)
                'MYR': 'myr',  // Malaysian Ringgit (uppercase)
                'usd': 'usd',  // US Dollar
                'USD': 'usd',  // US Dollar (uppercase)
                'eur': 'eur',  // Euro
                'EUR': 'eur',  // Euro (uppercase)
                'gbp': 'gbp',  // British Pound
                'GBP': 'gbp',  // British Pound (uppercase)
                'sgd': 'sgd',  // Singapore Dollar
                'SGD': 'sgd',  // Singapore Dollar (uppercase)
                'thb': 'thb',  // Thai Baht
                'THB': 'thb',  // Thai Baht (uppercase)
                'cad': 'cad',  // Canadian Dollar
                'CAD': 'cad',  // Canadian Dollar (uppercase)
                'aud': 'aud',  // Australian Dollar
                'AUD': 'aud',  // Australian Dollar (uppercase)
            };

            // Country mapping for currencies
            const countryMapping = {
                'myr': 'MY', // Malaysia
                'usd': 'US', // United States
                'eur': 'DE', // Germany (or any EU country)
                'gbp': 'GB', // United Kingdom
                'sgd': 'SG', // Singapore
                'thb': 'TH', // Thailand
                'cad': 'CA', // Canada
                'aud': 'AU', // Australia
            };

            const stripeCurrency = currencyMapping[planInfo.currency] || currencyMapping[planInfo.currency.toLowerCase()] || 'usd';
            const country = countryMapping[stripeCurrency] || 'US';

            const pr = stripe.paymentRequest({
                country: country,
                currency: stripeCurrency,
                total: {
                    label: `EduSocial Credits - ${planInfo.name}`,
                    amount: Math.round((planInfo.is_discounted ? planInfo.discount_price : planInfo.original_price) * 100),
                },
                requestPayerName: true,
                requestPayerEmail: true,
            });

            // Check if Google Pay is available
            pr.canMakePayment().then(result => {
                if (result) {
                    setPaymentRequest(pr);
                }
            });

            pr.on('paymentmethod', async (ev) => {
                try {
                    // Confirm the payment with the payment method from Google Pay
                    const { error, paymentIntent } = await stripe.confirmPayment({
                        elements: null, // Not using Elements for Payment Request
                        clientSecret,
                        confirmParams: {
                            payment_method: ev.paymentMethod.id,
                            return_url: `${window.location.origin}/business/payments-and-credits/buy-credits/checkout?orderId=${orderId}&status=success`,
                        },
                        redirect: 'if_required'
                    });

                    if (error) {
                        console.error('Google Pay payment error:', error);
                        ev.complete('fail');
                        onPaymentError?.(error);
                    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                        ev.complete('success');
                        onPaymentSuccess?.(paymentIntent);
                    } else {
                        ev.complete('fail');
                        onPaymentError?.(new Error('Payment was not successful'));
                    }
                } catch (error) {
                    console.error('Google Pay confirmation error:', error);
                    ev.complete('fail');
                    onPaymentError?.(error);
                }
            });
        }
    }, [stripe, planInfo, clientSecret, onPaymentSuccess, onPaymentError]);

    if (!paymentRequest) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Google Pay is not available on this device or browser. Please try using a card payment instead.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            <PaymentRequestButtonElement
                options={{ paymentRequest }}
                className="w-full"
            />
        </div>
    );
}

export default function CustomStripeCheckout() {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
    const [clientSecret, setClientSecret] = useState(null);
    const [paymentIntentId, setPaymentIntentId] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, error
    const [error, setError] = useState(null);

    // Get checkout context
    const { orderInfo, planInfo, status: checkoutStatus } = useCheckoutContext();
    const orderId = orderInfo?.id;

    // Hooks
    const { mutate: createPaymentIntent, isLoading: isCreatingPaymentIntent } = useStripePaymentIntent();
    const { mutate: checkPaymentStatus } = useStripePaymentStatus();

    // Check for return from redirect payment
    useEffect(() => {
        const paymentIntentFromUrl = searchParams.get('payment_intent');
        const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
        
        if (paymentIntentFromUrl && paymentIntentClientSecret) {
            // User returned from redirect payment, check status
            checkPaymentStatus({
                paymentIntentId: paymentIntentFromUrl,
                orderId
            }, {
                onSuccess: (data) => {
                    if (data.success && data.payment_intent.status === 'succeeded') {
                        setPaymentStatus('success');
                    } else {
                        setPaymentStatus('error');
                        setError('Payment was not completed successfully');
                    }
                },
                onError: (error) => {
                    setPaymentStatus('error');
                    setError(error.message);
                }
            });
        }
    }, [searchParams, checkPaymentStatus, orderId]);

    // Create payment intent when component mounts or payment method changes
    useEffect(() => {
        if (orderId && paymentStatus === 'idle') {
            // Map payment method to Stripe types
            const paymentMethodTypes = [selectedPaymentMethod === 'google_pay' ? 'card' : selectedPaymentMethod];

            // Reset client secret when payment method changes
            setClientSecret(null);
            setPaymentIntentId(null);
            setError(null);

            createPaymentIntent({
                orderId,
                paymentMethodTypes
            }, {
                onSuccess: (data) => {
                    if (data.success) {
                        setClientSecret(data.client_secret);
                        setPaymentIntentId(data.payment_intent_id);
                    } else {
                        setError(data.error || 'Failed to create payment intent');
                        setPaymentStatus('error');
                    }
                },
                onError: (error) => {
                    setError(error.message);
                    setPaymentStatus('error');
                }
            });
        }
    }, [orderId, selectedPaymentMethod, createPaymentIntent, paymentStatus]);

    const handlePaymentSuccess = (paymentIntent) => {
        setPaymentStatus('success');
        // Redirect to success page
        router.push(`/business/payments-and-credits/buy-credits/checkout?orderId=${orderId}&status=success`);
    };

    const handlePaymentError = (error) => {
        setPaymentStatus('error');
        setError(error.message);
    };

    // Show success state
    if (paymentStatus === 'success') {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-green-500 text-center flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        {t('paymentSuccess')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p>{t('thankYou')}</p>
                    <p>{t('creditsAdded')}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button 
                        variant="orange" 
                        onClick={() => router.push('/business/home')}
                    >
                        {t('backToHome')}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // Show error state
    if (paymentStatus === 'error') {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-red-500 text-center flex items-center justify-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Payment Error
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-red-600">{error}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setPaymentStatus('idle');
                            setError(null);
                            setClientSecret(null);
                            setPaymentIntentId(null);
                        }}
                    >
                        Try Again
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // Don't render Elements until we have a clientSecret
    if (!clientSecret) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Choose Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Payment Method Selection */}
                    <RadioGroup
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                        className="space-y-3"
                    >
                        {Object.values(PAYMENT_METHODS).map((method) => {
                            const Icon = method.icon;
                            return (
                                <div key={method.id} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                                    <RadioGroupItem value={method.id} id={method.id} />
                                    <Icon className="h-5 w-5 text-gray-600" />
                                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                                        <div className="font-medium">{method.name}</div>
                                        <div className="text-sm text-gray-500">{method.description}</div>
                                    </Label>
                                </div>
                            );
                        })}
                    </RadioGroup>

                    {/* Loading State */}
                    {isCreatingPaymentIntent && (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Preparing payment...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Choose Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Payment Method Selection */}
                    <RadioGroup
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                        className="space-y-3"
                    >
                        {Object.values(PAYMENT_METHODS).map((method) => {
                            const Icon = method.icon;
                            return (
                                <div key={method.id} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                                    <RadioGroupItem value={method.id} id={method.id} />
                                    <Icon className="h-5 w-5 text-gray-600" />
                                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                                        <div className="font-medium">{method.name}</div>
                                        <div className="text-sm text-gray-500">{method.description}</div>
                                    </Label>
                                </div>
                            );
                        })}
                    </RadioGroup>

                    {/* Payment Form */}
                    {clientSecret && paymentIntentId && (
                        <>
                            {selectedPaymentMethod === 'google_pay' ? (
                                <GooglePayButton
                                    onPaymentSuccess={handlePaymentSuccess}
                                    onPaymentError={handlePaymentError}
                                    clientSecret={clientSecret}
                                    paymentIntentId={paymentIntentId}
                                    orderId={orderId}
                                    planInfo={planInfo}
                                />
                            ) : (
                                <PaymentForm
                                    selectedMethod={selectedPaymentMethod}
                                    onPaymentSuccess={handlePaymentSuccess}
                                    onPaymentError={handlePaymentError}
                                    clientSecret={clientSecret}
                                    paymentIntentId={paymentIntentId}
                                    orderId={orderId}
                                />
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </Elements>
    );
}
