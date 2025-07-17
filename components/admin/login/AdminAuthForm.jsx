'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '../../ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../../ui/card';
import { Eye, EyeOff, Shield, Lock, User, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// 直接引入对应的函数而不是hook
import { AuthContext } from '@/hooks/useAdminAuth';
import { useContext } from 'react';

export default function AdminAuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = useState(false);
  
  // 使用useContext获取上下文
  const auth = useContext(AuthContext);
  
  // 如果上下文为空，提供降级功能
  const login = auth?.login || (async () => {
    console.error('AuthContext not available');
    return { success: false, error: 'Authentication context not available' };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!email || !password) {
        setError(t('emailAndPasswordRequired'));
        setIsLoading(false);
        return;
      }
      
      // 使用上下文中的login方法
      const result = await login(email, password);
      
      if (result.success) {
        toast.success(t('loginSuccess'));
        
        // 优先使用回调URL，如果存在
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          // 从pathname获取语言前缀
          const locale = pathname.split('/')[1] || 'en';
          router.push(`/${locale}/admin/dashboard`);
        }
        
        // 添加一个短暂延迟，确保认证状态有时间更新
        setTimeout(() => {
          //reset input
          setEmail('');
          setPassword('');
        }, 100); // 短暂延迟以允许状态更新
      } else {
        setError(result.error || t('loginFailed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A1929] items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden rounded-lg shadow-xl">
        {/* 左侧品牌区域 */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-[#0F2942] to-[#051728] p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-12">
              <Shield className="h-8 w-8 text-[#FF7D00]" />
              <h1 className="text-2xl font-bold text-white">EduSocial Admin</h1>
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white mb-4">
                {t('adminPortalAccess')}
              </h2>
              <p className="text-gray-300 mb-6">
                {t('secureAdminLogin')}
              </p>
            </div>
          </div>
        </div>
        
        {/* 右侧表单区域 */}
        <Card className="w-full md:w-3/5 border-0 rounded-none bg-[#051220]">
          <CardHeader className="pt-0 pb-4">
            <h1 className="text-2xl font-bold text-center text-white flex items-center justify-center">
              <Lock className="mr-2 h-5 w-5 text-[#FF7D00]" />
              {t('adminLogin')}
            </h1>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500 text-white rounded flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  {t('adminEmail')}
                </label>
                <div className="flex items-center border rounded-md bg-[#0A1929] border-[#132F4C] pl-3 pr-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-white">
                  <input
                    id="email"
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-0 py-2 flex-1 bg-transparent text-white border-none focus:outline-none"
                    disabled={isLoading}
                    placeholder={t('enterAdminEmail')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    {t('password')}
                  </label>
                    <Link 
                      href="/admin/forgot-password" 
                      className="text-[#FF7D00] text-sm hover:underline"
                    >
                      {t('forgotPassword')}
                    </Link>
                </div>
                <div className="flex items-center border rounded-md bg-[#0A1929] border-[#132F4C] pl-3 pr-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-white">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-0 py-2 flex-1 border rounded-md bg-[#0A1929] border-[#132F4C] text-white border-none focus:outline-none"
                    placeholder={t('enterPassword')}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white px-0 hover:text-[#FF7D00]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
          
          <Button 
            type="submit" 
                variant="orange"
                className="w-full py-3 px-4 rounded-md font-medium bg-[#FF7D00] text-white hover:bg-[#E57200] transition-colors disabled:opacity-50 mt-6"
                disabled={isLoading}
          >
                {isLoading 
                  ? t('signingInAsAdmin') 
                  : t('signInAsAdmin')}
          </Button>
        </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}