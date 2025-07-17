'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import Image from 'next/image';
import useAuth from '../../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function AuthForm({ isRegister = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const locale = useLocale();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isRegister) {
        // Validate password match
        if (password !== confirmPassword) {
          setError(t('passwordsDontMatch'));
          setIsLoading(false);
          return;
        }
        
        const result = await register({ name, email, password });
        
        if (result.success) {
          router.push(`/${locale}/login`);
        } else {
          setError(result.error || t('registrationFailed'));
        }
      } else {
        const result = await login(email, password);
        
        if (result.success) {
          // 确保会话已更新，强制刷新路由
          router.refresh();
          
          // 清除callbackUrl中可能的循环重定向
          let targetUrl = callbackUrl;
          if (targetUrl && targetUrl.includes('/login')) {
            targetUrl = `/${locale}/my`;
          } else if (!targetUrl) {
            targetUrl = `/${locale}/my`;
          }
          
          // 直接导航到目标页面
          setTimeout(() => {
            router.push(targetUrl); 
          }, 100); // 短暂延迟确保会话已更新
        } else {
          setError(result.error || t('loginFailed'));
        }
      }
    } catch (error) {
      setError(t('unexpectedError'));
      console.error(isRegister ? 'Registration error:' : 'Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider) => {
    try {
      setIsLoading(true);
      
      // 使用Next.js路由导航到OAuth端点
      const callbackUrl = searchParams.get('callbackUrl') || `/${locale}/my`;
      router.push(`/api/auth/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      setError(t('oauthError', { provider }));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 px-4 md:px-0 min-h-[80vh]">
      <div className="w-full md:w-[50%] flex flex-col items-center justify-center gap-2 order-2 md:order-1">
        <Image src="/qr-folder.webp" alt="EduSocial" width={0} height={0} className="w-[60%] h-[60%] object-cover" priority={true}/>
        <p className="text-center text-2xl font-bold">{t('youngPeopleDiscussing')}</p>
        <p className="text-center text-xl text-gray-500">{t('dontWantToMiss')}</p>
        <p className="text-center text-xl text-gray-500">{t('joinUsNow')}</p>
        <div className="flex flex-row items-center justify-center gap-2 mt-4">
          <Link href="https://play.google.com/store/apps/details?id=com.edusocial.app" target="_blank">
            <Image src="/google-play.webp" alt="EduSocial" width={0} height={0} style={{
              width: '180px',
              height: 'auto',
            }}/>
          </Link>
          <Link href="https://apps.apple.com/app/id6466398332" target="_blank">
            <Image src="/app-store.webp" alt="EduSocial" width={0} height={0} style={{
              width: '180px',
              height: 'auto',
            }}/>
          </Link>
        </div>
      </div>
      <Card className="w-full md:w-[40%] flex flex-col justify-between self-center max-w-md order-1 md:order-2">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">
            {isRegister ? t('register') : t('login')}
          </h1>
        </CardHeader>
        
        <CardContent className="flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-white rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister ? (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  {t('fullName')}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-[#0A1929] border-[#132F4C] text-white"
                  disabled={isLoading}
                  placeholder={t('enterFullName')}
                />
              </div>
            ) : (
              <div className="space-y-2">
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                {isRegister ? t('primaryEmail') : t('studentEmail')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md bg-[#0A1929] border-[#132F4C] text-white"
                disabled={isLoading}
                placeholder={t('enterEmail')}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  {t('password')}
                </label>
                {!isRegister && (
                  <Link 
                    href="/forgot-password" 
                    className="text-[#FF7D00] text-sm hover:underline"
                  >
                    {t('forgotPassword')}
                  </Link>
                )}
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
            
            {isRegister ? (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium">
                  {t('confirmPassword')}
                </label>
                <div className="flex items-center border rounded-md bg-[#0A1929] border-[#132F4C] pl-3 pr-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-white">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-0 py-2 flex-1 border rounded-md bg-[#0A1929] border-[#132F4C] text-white border-none focus:outline-none"
                    placeholder={t('confirmPasswordPlaceholder')}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-white px-0 hover:text-[#FF7D00]"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
              </div>
            )}
            
            <Button
              type="submit"
              variant="orange"
              className="w-full py-2 px-4 rounded-md font-medium bg-[#FF7D00] text-white disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading 
                ? (isRegister ? t('creatingAccount') : t('signingIn')) 
                : (isRegister ? t('createAccount') : t('signIn'))}
            </Button>

            {!isRegister ? (
              <div className="flex justify-center gap-2">
                <Button
                  variant="orange"
                  className="px-4 rounded-md font-medium disabled:opacity-50 bg-transparent hover:bg-transparent"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading}
                >
                  <Image src="/google.png" alt={t('signInWithGoogle')} width={20} height={20} />
                </Button>
                <Button
                  variant="orange"
                  className="px-4 rounded-md font-medium disabled:opacity-50 bg-transparent hover:bg-transparent"
                  onClick={() => handleOAuthSignIn('facebook')}
                  disabled={isLoading}
                >
                  <Image src="/facebook.png" alt={t('loginWithFacebook')} width={20} height={20} />
                </Button>
                <Button
                  variant="orange"
                  className="px-4 rounded-md font-medium disabled:opacity-50 bg-transparent hover:bg-transparent"
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={isLoading}
                >
                  <Image src="/github.svg" alt={t('loginWithGithub')} width={20} height={20} />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
              </div>
            )}
          </form>
        </CardContent>
        
        <CardFooter className="text-center">
          <>
            {isRegister ? (
              <Link href="/login" className="text-[#FF7D00] text-sm hover:underline">
                {t('alreadyHaveAccount')}
              </Link>
            ) : (
              <>
                <Link 
                  href="/resend-verification-letter" 
                  className="text-[#FF7D00] text-sm hover:underline"
                >
                  {t('verificationLetter')}
                </Link>
              </>
            )}
            <p className="text-sm text-gray-500 mt-4">
              {t('termsAgreement')} {' '}
              <Link href="/terms-of-service" className="text-[#FF7D00] text-sm hover:underline">
                {t('termsOfService')}
              </Link>
              {' '} {t('and')} {' '}
              <Link href="/privacy-policy" className="text-[#FF7D00] text-sm hover:underline">
                {t('privacyPolicy')}
              </Link>
            </p>
          </>
        </CardFooter>
      </Card>
    </div>
  );
} 