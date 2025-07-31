'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { creditOrdersApi, creditPlansApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';
import { useTranslations } from 'next-intl';

// CheckoutContext as described in documentation
const CheckoutContext = createContext(null);

export function CheckoutProvider({ children, orderId }) {
    const [orderInfo, setOrderInfo] = useState(null);
    const [planInfo, setPlanInfo] = useState(null);
    const [status, setStatus] = useState('loading'); // loading, ready, error, already_paid
    const [error, setError] = useState(null);
    const t = useTranslations('Checkout');

    // Early return with loading state if no orderId
    if (!orderId) {
        const value = useMemo(() => ({
            orderInfo: null,
            planInfo: null,
            status: 'error',
            error: t('no_order_id_provided'),
            isLoading: false,
            isOrderLoading: false,
            isPlanLoading: false,
        }), []);

        return (
            <CheckoutContext.Provider value={value}>
                {children}
            </CheckoutContext.Provider>
        );
    }

    // Fetch order data when orderId changes
    const { data: orderData, isLoading: isOrderLoading, error: orderError } = useQuery({
        queryKey: queryKeys.creditOrders.detail(orderId),
        queryFn: async () => {
            if (!orderId) return null;
            const response = await creditOrdersApi.getById(orderId);

            // Handle different response structures
            if (response.success && response.credit_order) {
                return response.credit_order;
            } else if (response.credit_order) {
                return response.credit_order;
            } else if (response.data) {
                return response.data;
            } else {
                console.error('Unexpected response structure:', response);
                return response;
            }
        },
        enabled: !!orderId,
    });

    // Fetch plan data based on order's plan_id
    const { data: planData, isLoading: isPlanLoading, error: planError } = useQuery({
        queryKey: queryKeys.creditPlans.detail(orderData?.plan_id),
        queryFn: async () => {
            if (!orderData?.plan_id) return null;
            const response = await creditPlansApi.getByPlanId(orderData.plan_id);
            return response; // API returns plan directly, not wrapped
        },
        enabled: !!orderData?.plan_id,
    });

    useEffect(() => {
        if (orderError) {
            setError(t('order_not_found_or_invalid'));
            setStatus('error');
            return;
        }

        if (planError) {
            setError(t('plan_not_found_or_invalid'));
            setStatus('error');
            return;
        }

        if (orderData) {
            // Get the status with fallback handling
            let orderStatus = orderData.status;

            // Handle different possible data structures
            if (!orderStatus && orderData.credit_order) {
                orderStatus = orderData.credit_order.status;
            }
            if (!orderStatus && orderData.data) {
                orderStatus = orderData.data.status;
            }

            // Handle null or undefined status
            if (!orderStatus) {
                console.error('Order status is null or undefined after all fallbacks:', orderData);
                console.error('Full order object:', JSON.stringify(orderData, null, 2));
                setError('Order status is missing. Please contact support.');
                setStatus('error');
                return;
            }

            // Validate order status - allow pending orders for checkout
            // Only pending orders should be allowed for checkout
            // Paid orders should show success page, others should show error
            const validStatusesForCheckout = ['pending'];
            if (!validStatusesForCheckout.includes(orderStatus)) {
                // If order is already paid, set a special status to indicate success
                if (orderStatus === 'paid') {
                    setStatus('already_paid');
                    setError(null); // Clear any error since this is actually a success case
                } else {
                    // Create a more explicit error message to avoid translation issues
                    const errorMessage = `Order status '${orderStatus}' is not valid for checkout`;
                    console.error('Invalid order status:', errorMessage);
                    setError(errorMessage);
                    setStatus('error');
                }
                return;
            }

            setOrderInfo(orderData);

            // Set plan info when both order and plan data are available
            if (planData) {
                setPlanInfo(planData);
                setStatus('ready');
            } else if (!isPlanLoading) {
                setStatus('ready'); // Ready even if plan is not loaded yet
            }
        }
    }, [orderData, orderError, planData, planError, isPlanLoading]);

    const value = useMemo(() => ({
        orderInfo,
        planInfo,
        status,
        error,
        isLoading: isOrderLoading || isPlanLoading,
        isOrderLoading,
        isPlanLoading,
    }), [orderInfo, planInfo, status, error, isOrderLoading, isPlanLoading]);

    return (
        <CheckoutContext.Provider value={value}>
            {children}
        </CheckoutContext.Provider>
    );
}

export function useCheckoutContext() {
    const context = useContext(CheckoutContext);
    if (!context) {
        console.error('useCheckoutContext must be used within CheckoutProvider. Make sure the component is wrapped with CheckoutProvider.');
        throw new Error('useCheckoutContext must be used within CheckoutProvider');
    }
    return context;
}

// Note: The original useCheckout hook has been removed as it's no longer used.
// All payment processing now goes through the Stripe-specific hooks and APIs.