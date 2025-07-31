'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditOrdersApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useUpdateCreditOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (inputData) => {
            const { orderId, ...updateData } = inputData;

            // Prepare the data structure expected by the API
            const requestData = {
                data: {
                    status: updateData.status,
                    paymentProvider: updateData.paymentProvider,
                    paymentReference: updateData.paymentReference,
                    paidAt: updateData.paidAt,
                    ...updateData // Allow additional fields
                }
            };

            const response = await creditOrdersApi.update(orderId, requestData);
            return response; // creditOrdersApi.update already returns parsed JSON
        },
        onSuccess: (data, variables) => {
            const { orderId } = variables;

            queryClient.invalidateQueries({
                queryKey: queryKeys.creditOrders.all
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.creditOrders.detail(orderId)
            });

            return data;
        },
    });
};

export default useUpdateCreditOrder; 