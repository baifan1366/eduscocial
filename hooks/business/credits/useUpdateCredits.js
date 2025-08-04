'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { businessCreditsApi, creditPlansApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useUpdateCredits = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (inputData) => {
            try {
                // Get user ID from localStorage or session
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    throw new Error('User ID not found');
                }

                // Get plan details to determine credit amount to add
                const planResponse = await creditPlansApi.getByPlanId(inputData.planId);
                const plan = planResponse;

                if (!plan) {
                    throw new Error('Plan not found');
                }

                // Get current credits
                let currentCredits = { total_credits: 0, used_credits: 0 };
                try {
                    const creditsResponse = await businessCreditsApi.getAll(userId);
                    currentCredits = creditsResponse.business_credit || currentCredits;
                } catch (error) {
                    console.warn('Could not fetch current credits, assuming 0:', error);
                }

                // Use creditToAdd to properly add credits instead of replacing
                const updateData = {
                    creditToAdd: plan.credit_amount,
                    usedCredits: currentCredits.used_credits || 0,
                    ...inputData // Allow overriding any of the above
                };

                const response = await businessCreditsApi.update(userId, { data: updateData });
                return response;
            } catch (error) {
                console.error('Credits update failed:', error);
                throw error;
            }
        },
        onSuccess: () => {
            // 更新相关查询
            queryClient.invalidateQueries({
                queryKey: queryKeys.businessCredits.all
            });

            return true;
        },
    });
};

export default useUpdateCredits;