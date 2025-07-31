'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stripeApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for creating Stripe payment intents
 * @returns {Object} Mutation object with mutate function and state
 */
export default function useStripePaymentIntent() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data) => {
            const {
                orderId,
                paymentMethodTypes = ['card']
            } = data;

            // Validate required parameters - only orderId is required now
            if (!orderId) {
                throw new Error('Missing required parameter: orderId');
            }

            const response = await stripeApi.createPaymentIntent({
                orderId,
                paymentMethodTypes
            });

            return response;
        },
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.creditOrders.detail(variables.orderId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.payments.all 
            });
        },
        onError: (error) => {
            console.error('Failed to create payment intent:', error);
        }
    });

    return mutation;
}
