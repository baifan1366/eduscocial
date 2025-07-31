'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query';
import queryKeys from '@/lib/queryKeys';
import { boardCategoryMappingApi } from '@/lib/api';


export default function useMatchBoardWithCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => boardCategoryMappingApi.update(data),
        onSuccess: (_, variables) => {
            // 更新成功后，使相关的查询缓存失效
            queryClient.invalidateQueries({ queryKey: queryKeys.boardCategoryMappings.all });
            
            // 如果更新了特定看板的分类，也使该看板的分类查询缓存失效
            if (variables.data?.boardId) {
                queryClient.invalidateQueries({ 
                    queryKey: queryKeys.boardCategoryMappings.byBoardId(variables.data.boardId) 
                });
            }
        },
    });
}