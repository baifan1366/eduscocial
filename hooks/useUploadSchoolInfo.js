import { useMutation } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';

/**
 * 用于上传学校信息的钩子
 * @returns {Object} 变更操作对象
 */
export default function useUploadSchoolInfo() {
  return useMutation({
    mutationFn: async ({ country, school, department, file }) => {
      try {
        // 验证必要参数
        if (!country || !school || !department || !file) {
          throw new Error('Please fill in all required fields and upload proof documents');
        }

        // 读取文件为 base64 格式
        const fileData = await readFileAsBase64(file);
        
        // 准备请求数据
        const requestData = {
          country,
          school,
          department,
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: fileData
          }
        };

        // 使用 API 客户端发送请求
        const response = await settingsApi.settings.uploadSchoolInfo(requestData);
        return response;
      } catch (error) {
        console.error('error:', error);
        throw error;
      }
    }
  });
}

/**
 * 将文件读取为 base64 字符串
 * @param {File} file - 要读取的文件
 * @returns {Promise<string>} base64 编码的文件数据
 */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
} 