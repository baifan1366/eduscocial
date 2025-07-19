'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Eye, EyeOff, Shield, Lock, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLogin, useRegister } from '@/hooks/useAuth';

export default function AuthForm({ isRegister = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = useState(false);
  
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
    <div className="flex items-center justify-center min-h-screen bg-[#0A1929]">
      <div className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden rounded-lg shadow-xl">
        {/* Left side brand area */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-[#0F2942] to-[#051728] p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-12">
              <Shield className="h-8 w-8 text-[#FF7D00]" />
              <h1 className="text-2xl font-bold text-white">EduSocial</h1>
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white mb-4">
                {isRegister ? t('createAccount') : t('welcomeBack')}
              </h2>
              <p className="text-gray-300 mb-6">
                {isRegister ? t('joinCommunity') : t('loginToContinue')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side form area */}
        <Card className="w-full md:w-3/5 border-0 rounded-none bg-[#051220]">
          <CardHeader className="pt-6 pb-4">
            <h1 className="text-2xl font-bold text-center text-white flex items-center justify-center">
              <User className="mr-2 h-5 w-5 text-[#FF7D00]" />
              {isRegister ? t('register') : t('login')}
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
                  {t('email')}
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
                    placeholder={t('enterEmail')}
                  />
                </div>
              </div>

              {isRegister && (
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                    {t('username')}
                  </label>
                  <div className="flex items-center border rounded-md bg-[#0A1929] border-[#132F4C] pl-3 pr-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-white">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full px-0 py-2 flex-1 bg-transparent text-white border-none focus:outline-none"
                      disabled={isLoading}
                      placeholder={t('enterUsername')}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
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

              {isRegister && (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                    {t('confirmPassword')}
                  </label>
                  <div className="flex items-center border rounded-md bg-[#0A1929] border-[#132F4C] pl-3 pr-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-white">
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-0 py-2 flex-1 border rounded-md bg-[#0A1929] border-[#132F4C] text-white border-none focus:outline-none"
                      placeholder={t('confirmYourPassword')}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
          
              <Button 
                type="submit" 
                variant="orange"
                className="w-full py-3 px-4 rounded-md font-medium bg-[#FF7D00] text-white hover:bg-[#E57200] transition-colors disabled:opacity-50 mt-6"
                disabled={isLoading}
              >
                {isLoading 
                  ? (isRegister ? t('creatingAccount') : t('signingIn'))
                  : (isRegister ? t('createAccount') : t('signIn'))}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-300">
                {isRegister ? t('alreadyHaveAccount') : t('dontHaveAccount')}
                <Link
                  href={isRegister ? `/${pathname.split('/')[1]}/login` : `/${pathname.split('/')[1]}/register`}
                  className="text-[#FF7D00] ml-1 hover:underline"
                >
                  {isRegister ? t('login') : t('register')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 