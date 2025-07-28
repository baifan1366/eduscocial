'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { paymentsApi, creditOrdersApi, creditPlansApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

// CheckoutContext as described in documentation
const CheckoutContext = createContext(null);

export function CheckoutProvider({ children, orderId }) {
    const [orderInfo, setOrderInfo] = useState(null);
    const [planInfo, setPlanInfo] = useState(null);
    const [status, setStatus] = useState('loading'); // loading, ready, error
    const [error, setError] = useState(null);

    // Debug logging
    console.log('CheckoutProvider - orderId:', orderId);

    // Early return with loading state if no orderId
    if (!orderId) {
        console.log('CheckoutProvider - No orderId provided');
        const value = useMemo(() => ({
            orderInfo: null,
            planInfo: null,
            status: 'error',
            error: 'No order ID provided',
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
            return response.credit_order;
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
            setError('Order not found or invalid');
            setStatus('error');
            return;
        }

        if (planError) {
            setError('Plan not found or invalid');
            setStatus('error');
            return;
        }

        if (orderData) {
            // Validate order status - allow pending, paid, completed statuses
            const validStatuses = ['pending', 'paid', 'completed'];
            if (!validStatuses.includes(orderData.status)) {
                setError(`Order status '${orderData.status}' is not valid for checkout`);
                setStatus('error');
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

// Original useCheckout hook for payment processing
export default function useCheckout() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const response = await paymentsApi.checkout(data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.payments.checkout });
        },
    });

    return mutation;
}