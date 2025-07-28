'use client';

import { useQuery } from '@tanstack/react-query';
import { creditOrdersApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

export default function useGetCreditOrderByOrderId(orderId, options = {}) {
    return useQuery({
        queryKey: queryKeys.creditOrders.detail(orderId),
        queryFn: async () => {
            if (!orderId) return null;
            const response = await creditOrdersApi.getById(orderId);
            return response.data;
        },
        // 添加缓存策略，保留数据5分钟
        staleTime: 5 * 60 * 1000, 
        // 如果已经有数据，不需要重新获取
        enabled: !!orderId && (options.enabled !== false),
        // 合并传入的自定义选项
        ...options
    });
} 