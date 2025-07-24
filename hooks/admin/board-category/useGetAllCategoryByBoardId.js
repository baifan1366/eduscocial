'use client'

import { useQuery } from '@tanstack/react-query';
import queryKeys from '@/lib/queryKeys';
import { boardCategoryMappingApi } from '@/lib/api';

export default function useGetAllCategoryByBoardId(boardId) {
    return useQuery({
        queryKey: queryKeys.boardCategoryMappings.byBoardId(boardId),
        queryFn: () => {
            // 如果boardId为null或undefined，直接返回空数组
            if (!boardId) {
                return { categories: [] };
            }
            return boardCategoryMappingApi.getAll(boardId);
        },
        enabled: !!boardId, // 只有当boardId存在时才执行查询
    });
}