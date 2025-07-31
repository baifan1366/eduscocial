'use client'

import { useQuery } from '@tanstack/react-query';
import queryKeys from '@/lib/queryKeys';
import { boardCategoryMappingApi } from '@/lib/api';

export default function useGetAllBoardByCategoryId(categoryId) {
    return useQuery({
        queryKey: queryKeys.boardCategoryMappings.byCategoryId(categoryId),
        queryFn: () => {
            // 如果categoryId为null或undefined，直接返回空数组
            if (!categoryId) {
                return { boards: [] };
            }
            return boardCategoryMappingApi.getAll(categoryId);
        },
        enabled: !!categoryId, // 只有当categoryId存在时才执行查询
    });
}