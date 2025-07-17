import { useQuery } from '@tanstack/react-query';
import { boardsApi } from '@/lib/api';

/**
 * 用于获取面板列表的钩子
 * @param {Object} options - 查询选项
 * @param {boolean} options.enabled - 是否启用查询
 * @param {Object} options.filters - 过滤条件
 * @param {string} options.orderBy - 排序字段
 * @param {string} options.orderDirection - 排序方向 ('asc' 或 'desc')
 * @param {number} options.limit - 限制返回的记录数
 * @param {number} options.offset - 查询偏移量
 * @returns {Object} 查询结果
 */
export default function useGetBoards(options = {}) {
  const { 
    enabled = true, 
    filters = {}, 
    orderBy = 'name', 
    orderDirection = 'asc',
    limit = 100,
    offset = 0 
  } = options;

  // 构建查询参数
  const queryParams = {
    orderBy,
    orderDirection,
    limit,
    offset,
    ...filters
  };

  return useQuery(
    ['boards', orderBy, orderDirection, limit, offset, filters],
    async () => {
      try {
        return await boardsApi.getAll(queryParams);
      } catch (error) {
        console.error('error:', error);
        throw error;
      }
    },
    {
      enabled,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 分钟
    }
  );
} 