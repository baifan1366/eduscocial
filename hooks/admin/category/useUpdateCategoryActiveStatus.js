'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useUpdateCategoryActiveStatus = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ categoryId, data }) => categoryApi.updateCategoryActiveStatus(categoryId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
        },
    });
};

export default useUpdateCategoryActiveStatus;