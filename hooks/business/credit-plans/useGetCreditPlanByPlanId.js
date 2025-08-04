'use client';

import { useQuery } from '@tanstack/react-query';
import { creditPlansApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

export default function useGetCreditPlanByPlanId(planId, options = {}) {
    return useQuery({
        queryKey: queryKeys.creditPlans.detail(planId),
        queryFn: async () => {
            if (!planId) return null;
            const response = await creditPlansApi.getById(planId);
            return response.data;
        },
        // 添加缓存策略，保留数据5分钟
        staleTime: 5 * 60 * 1000, 
        // 如果已经有数据，不需要重新获取
        enabled: !!planId && (options.enabled !== false),
        // 合并传入的自定义选项
        ...options
    });
} 