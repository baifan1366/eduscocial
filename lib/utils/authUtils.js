/**
 * 检查是否为认证路径
 * 这个函数可以在服务端和客户端组件中使用
 */
export function checkBusinessAuthentication(pathname) {
  const unauthPaths = ['/login', '/register', '/forgot-password'];
  return !unauthPaths.some(path => pathname.includes(path));
} 