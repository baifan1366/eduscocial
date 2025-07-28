'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useUpdateCreditOrder from "@/hooks/business/credit-order/useUpdateCreditOrder";
import useCheckout, { useCheckoutContext } from "@/hooks/business/payments/useCheckout";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useTranslations } from 'next-intl';
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('Checkout');

    // Use CheckoutContext with safe defaults
    let contextData;
    try {
        contextData = useCheckoutContext();
    } catch (contextError) {
        console.error('CheckoutContext not available:', contextError);
        contextData = {
            orderInfo: null,
            planInfo: null,
            status: 'error',
            error: 'CheckoutProvider is not properly configured',
            isLoading: false
        };
    }

    // Destructure with safe defaults
    const {
        orderInfo = null,
        planInfo = null,
        status = 'loading',
        error: contextError = null,
        isLoading = true
    } = contextData || {};

    const { mutate: checkout, isPending } = useCheckout();
    const { mutate: updateCreditOrder } = useUpdateCreditOrder();

    const [paymentStatus, setPaymentStatus] = useState(null);
    const [paymentProcessed, setPaymentProcessed] = useState(false);

    const currentPlan = planInfo;
    const orderId = orderInfo?.id;
    const planId = orderInfo?.plan_id;
    
    useEffect(() => {
        // Error handling as documented: redirect if order not found or not pending
        if (status === 'error' && (contextError || error)) {
            console.error('Checkout error:', contextError || error);
            router.push('/business/payments-and-credits/buy-credits?error=order-not-found');
            return;
        }

        // 检查URL是否包含支付成功或取消的参数
        const paymentStatusFromUrl = searchParams.get('status');
        if (paymentStatusFromUrl) {
            setPaymentStatus(paymentStatusFromUrl);

            // Only process payment once to prevent infinite loops
            if (paymentStatusFromUrl === 'success' && orderId && !paymentProcessed) {
                setPaymentProcessed(true);

                // Note: Credit processing, invoice creation, and transaction recording
                // are handled by the Stripe webhook to prevent duplicate processing.
                // Frontend handles UI updates and safe database records.

                // Optional: Update order status for UI consistency (webhook also does this)
                // This is safe to do as it's idempotent
                updateCreditOrder({
                    orderId,
                    status: 'paid'
                });
            }
        }
    }, [searchParams, orderInfo, status, contextError, router, orderId, paymentProcessed]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!currentPlan) return;
        
        checkout({
            amount: currentPlan.is_discounted ? currentPlan.discount_price * 100 : currentPlan.original_price * 100,
            currency: currentPlan.currency.toLowerCase(),
            planId,
            orderId
        });
    }
    
    // 显示加载状态
    if (isLoading || status === 'loading') {
        return <Skeleton className="w-full h-full" />;
    }

    // 显示错误状态
    if (status === 'error') {
        return (
            <Card className="w-full h-full flex flex-col">
                <CardHeader>
                    <CardTitle>{t('orderSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="text-center text-red-500">
                        <p>{contextError || 'An error occurred while loading order data'}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (paymentStatus === 'success') {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-green-500 text-center">{t('paymentSuccess')}</CardTitle>
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
    
    if (paymentStatus === 'cancel') {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-red-500 text-center">{t('paymentCancelled')}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p>{t('paymentCancelMessage')}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button 
                        variant="outline" 
                        onClick={() => setPaymentStatus(null)}
                    >
                        {t('tryAgain')}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{t('orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
                {currentPlan && (
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span>{t('credits')}:</span>
                            <span>{currentPlan.credit_amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{t('price')}:</span>
                            <span>
                                {currentPlan.is_discounted ? (
                                    <div className="flex gap-2">
                                        <span className="line-through text-gray-400">
                                            {currentPlan.currency} {currentPlan.original_price}
                                        </span>
                                        <span className="font-bold text-orange-500">
                                            {currentPlan.currency} {currentPlan.discount_price}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="font-bold">
                                        {currentPlan.currency} {currentPlan.original_price}
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                            <span>{t('total')}:</span>
                            <span className="text-orange-500">
                                {currentPlan.currency} {currentPlan.is_discounted ? currentPlan.discount_price : currentPlan.original_price}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <form onSubmit={handleSubmit} className="w-full">
                    <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isPending}
                        variant="orange"
                    >
                        {isPending ? t('processing') : t('proceedToPayment')}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
