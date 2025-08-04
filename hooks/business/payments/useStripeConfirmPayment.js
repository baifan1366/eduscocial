'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stripeApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for confirming Stripe payments
 * @returns {Object} Mutation object with mutate function and state
 */
export default function useStripeConfirmPayment() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const {
                paymentIntentId,
                paymentMethodId,
                paymentMethodType,
                returnUrl
            } = data;

            // Validate required parameters
            if (!paymentIntentId) {
                throw new Error('Missing required parameter: paymentIntentId');
            }

            if (!paymentMethodType) {
                throw new Error('Missing required parameter: paymentMethodType');
            }

            // For card and google_pay, paymentMethodId is required
            if (['card', 'google_pay'].includes(paymentMethodType) && !paymentMethodId) {
                throw new Error(`Payment method ID is required for ${paymentMethodType}`);
            }

            // For redirect methods, returnUrl is required
            if (['alipay', 'grabpay'].includes(paymentMethodType) && !returnUrl) {
                throw new Error(`Return URL is required for ${paymentMethodType}`);
            }

            const response = await stripeApi.confirmPayment({
                paymentIntentId,
                paymentMethodId,
                paymentMethodType,
                returnUrl
            });

            return response;
        },
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.payments.all 
            });
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.creditOrders.all 
            });
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.creditTransactions.all 
            });
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.businessCredits.all 
            });
        },
        onError: (error) => {
            console.error('Failed to confirm payment:', error);
        }
    });

    return mutation;
}

/**
 * Hook for getting payment status
 */
export function useStripePaymentStatus() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const { paymentIntentId, orderId } = data;

            if (!paymentIntentId && !orderId) {
                throw new Error('Either paymentIntentId or orderId is required');
            }

            const response = await stripeApi.getPaymentStatus({
                paymentIntentId,
                orderId
            });

            return response;
        },
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.payments.all
            });

            if (variables.orderId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.creditOrders.detail(variables.orderId)
                });
            }
        },
        onError: (error) => {
            console.error('Failed to get payment status:', error);
        }
    });

    return mutation;
}

/**
 * Hook for refreshing payment status (POST method)
 */
export function useStripeRefreshPaymentStatus() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const { paymentIntentId, orderId } = data;

            if (!paymentIntentId && !orderId) {
                throw new Error('Either paymentIntentId or orderId is required');
            }

            const response = await stripeApi.refreshPaymentStatus({
                paymentIntentId,
                orderId
            });

            return response;
        },
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.payments.all
            });

            if (variables.orderId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.creditOrders.detail(variables.orderId)
                });
            }
        },
        onError: (error) => {
            console.error('Failed to refresh payment status:', error);
        }
    });

    return mutation;
}
