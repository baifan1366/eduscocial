'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditTransactionsApi, creditPlansApi, businessCreditsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useCreateCreditTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (inputData) => {
            try {
                // Get plan details to determine credit amount
                const planResponse = await creditPlansApi.getByPlanId(inputData.planId);
                const plan = planResponse;

                if (!plan) {
                    throw new Error('Plan not found');
                }

                // Get current user credits to calculate balance_after
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    throw new Error('User ID not found');
                }

                let currentCredits = 0;
                try {
                    const creditsResponse = await businessCreditsApi.getAll(userId);
                    currentCredits = creditsResponse.business_credit?.total_credits || 0;
                } catch (error) {
                    console.warn('Could not fetch current credits, assuming 0:', error);
                }

                // Create transaction data
                const transactionData = {
                    orderId: inputData.orderId,
                    type: inputData.type || 'top_up',
                    creditChange: plan.credit_amount,
                    balanceAfter: currentCredits + plan.credit_amount,
                    description: inputData.description || `Credit purchase - ${plan.name || 'Credit Plan'}`,
                    ...inputData // Allow overriding any of the above
                };

                const response = await creditTransactionsApi.create({ data: transactionData });
                return response;
            } catch (error) {
                console.error('Credit transaction creation failed:', error);
                throw error;
            }
        },
        onSuccess: () => {
            // 更新相关查询
            queryClient.invalidateQueries({
                queryKey: queryKeys.creditTransactions.all
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.businessCredits.all
            });

            return true;
        },
    });
};

export default useCreateCreditTransaction;