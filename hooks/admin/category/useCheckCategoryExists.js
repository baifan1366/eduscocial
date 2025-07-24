'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/lib/api';

/**
 * 检查分类名称或别名是否存在的钩子
 * @param {Object} options - 查询选项
 * @param {string} options.name - 要检查的分类名称
 * @param {boolean} options.enabled - 是否启用查询
 * @returns {Object} 查询结果
 */
export default function useCheckCategoryExists({ name, enabled = !!name }) {
  const [isChecking, setIsChecking] = useState(false);

  const query = useQuery({
    queryKey: ['categoryExists', name],
    queryFn: async () => {
      setIsChecking(true);
      try {
        const response = await categoryApi.checkExists({ name: name });
        return response;
      } catch (error) {
        console.error('Error checking category name:', error);
        throw error;
      } finally {
        setIsChecking(false);
      }
    },
    enabled: enabled && name?.length > 0,
    staleTime: 0, // 不缓存，每次都重新查询
  });

  return {
    ...query,
    isChecking,
  };
} 