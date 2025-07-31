'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { boardsApi } from '@/lib/api';

/**
 * 检查板块名称或别名是否存在的钩子
 * @param {Object} options - 查询选项
 * @param {string} options.boardName - 要检查的板块名称
 * @param {boolean} options.enabled - 是否启用查询
 * @returns {Object} 查询结果
 */
export default function useCheckBoardExists({ boardName, enabled = !!boardName }) {
  const [isChecking, setIsChecking] = useState(false);

  const query = useQuery({
    queryKey: ['boardExists', boardName],
    queryFn: async () => {
      setIsChecking(true);
      try {
        const response = await boardsApi.checkExists({ name: boardName });
        return response;
      } catch (error) {
        console.error('Error checking board name:', error);
        throw error;
      } finally {
        setIsChecking(false);
      }
    },
    enabled: enabled && boardName?.length > 0,
    staleTime: 0, // 不缓存，每次都重新查询
  });

  return {
    ...query,
    isChecking,
  };
} 