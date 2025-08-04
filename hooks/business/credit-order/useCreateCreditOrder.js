'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { creditOrdersApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useCreateCreditOrder = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationKey: queryKeys.creditOrders.create,
        mutationFn: async (data) => {
            try {
                // creditOrdersApi.create已经在内部调用了response.json()
                const result = await creditOrdersApi.create(data);
                return result;
            } catch (error) {
                console.error('创建订单出错:', error);
                throw error;
            }
        },
        onSuccess: (data) => {
            // 成功后使相关查询失效
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.creditOrders.all 
            });
            
            return data;
        },
    });
};

export default useCreateCreditOrder;