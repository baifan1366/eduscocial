'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useUpdateBoardStatus = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ boardId, data }) => boardsApi.updateBoardStatus(boardId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
        },
    });
};

export default useUpdateBoardStatus;