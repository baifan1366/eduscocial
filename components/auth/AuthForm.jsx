'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useLogin, useRegister } from '@/hooks/useAuth';
import Image from 'next/image';

export default function AuthForm({ isRegister = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Use the appropriate authentication hook based on whether this is register or login
  const { login, isLoading: isLoginLoading, error: loginError, setError: setLoginError } = useLogin();
  const { register, isLoading: isRegisterLoading, error: registerError, setError: setRegisterError } = useRegister();
  
  const isLoading = isRegister ? isRegisterLoading : isLoginLoading;

  // Clear any errors when switching between login and register
  useState(() => {
    setError('');
    if (isRegister) {
      setLoginError(null);
    } else {
      setRegisterError(null);
    }
  }, [isRegister]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!email || !password) {
        setError(t('emailAndPasswordRequired'));
        return;
      }
      
      if (isRegister) {
        // Check if username is provided for registration
        if (!username) {
          setError(t('usernameRequired'));
          return;
        }
        
        // Check if passwords match
        if (password !== confirmPassword) {
          setError(t('passwordsDontMatch'));
          return;
        }
        
        // Register user
        await register({ email, password, username });
        
      } else {
        // Login user
        await login({ email, password });
      }
      
      // On success, toast notification will be shown by the hook
      toast.success(isRegister ? t('registerSuccess') : t('loginSuccess'));
      
      // Navigate to callback URL or home page
      // 注意：由于在useAuth.js中已经处理了重定向逻辑，这里不需要再执行重定向
      // 重定向会在useAuth hooks的onSuccess回调中处理
      
    } catch (error) {
      console.error(isRegister ? 'Registration error:' : 'Login error:', error);
      setError(error.message || (isRegister ? t('registerFailed') : t('loginFailed')));
    }
  };

  // Set error from hooks
  useState(() => {
    if (isRegister && registerError) {
      setError(registerError);
    } else if (!isRegister && loginError) {
      setError(loginError);
    }
  }, [registerError, loginError]);

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

            {isRegister ? (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  {t('username')}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-[#0A1929] border-[#132F4C] text-white"
                  disabled={isLoading}
                  placeholder={t('enterUsername')}
                />
              </div>
            ) : (
              <div className="space-y-2">
              </div>
            )}
            
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
                  className="text-white px-0 hover:text-[#FF7D00] bg-transparent hover:bg-transparent"
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
                    className="text-white px-0 hover:text-[#FF7D00] bg-transparent hover:bg-transparent"
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
                  disabled={isLoading}
                >
                  <Image src="/facebook.png" alt={t('loginWithFacebook')} width={20} height={20} />
                </Button>
                <Button
                  variant="orange"
                  className="px-4 rounded-md font-medium disabled:opacity-50 bg-transparent hover:bg-transparent"
                  disabled={isLoading}
                >
                  <Image src="/email.png" alt={t('emailSignIn')} width={20} height={20} />
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