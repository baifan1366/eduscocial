'use client';

import { useState } from 'react';
import { Button } from '../../ui/button';
import { useBusinessRegister } from '../../../hooks/useAuth';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardContent, CardFooter } from '../../ui/card';
import { Eye, EyeOff, Lock, AlertCircle, Briefcase, Building2, BarChart3 } from 'lucide-react';

export default function BusinessAuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  // Use the appropriate authentication hook based on whether this is register or login
  const { register, isLoading: isRegisterLoading, error: registerError, setError: setRegisterError } = useBusinessRegister();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!email || !password || !businessName) {
        setError(t('emailAndPasswordRequired'));
        return;
      }
      
      // Check if username is provided for registration
      if (!businessName) {
        setError(t('businessNameRequired'));
        return;
      }
      
      // Check if passwords match
      if (password !== confirmPassword) {
        setError(t('passwordsDontMatch'));
        return;
      }
      
      // Register user
      await register({ email, password, businessName });
        
      // On success, toast notification will be shown by the hook
      toast.success(t('registerSuccess'));
      
      // Navigate to callback URL or home page
      // 注意：由于在useAuth.js中已经处理了重定向逻辑，这里不需要再执行重定向
      // 重定向会在useAuth hooks的onSuccess回调中处理
      
    } catch (error) {
      console.error('Business registration error:', error);
      setError(error.message || t('businessRegistrationFailed'));
    }
  };

  // Set error from hooks
  useState(() => {
    if (registerError) {
      setError(registerError);
    }
  }, [registerError]);

  return (
    <div className="flex min-h-screen bg-[#0A1929] items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden rounded-lg shadow-xl">
        {/* 左侧品牌区域 */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-[#0F2942] to-[#051728] p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-12">
              <Briefcase className="h-8 w-8 text-[#FF7D00]" />
              <h1 className="text-2xl font-bold text-white">EduSocial Business</h1>
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white mb-4">
                {t('businessPortalAccess')}
              </h2>
              <p className="text-gray-300 mb-6">
                {t('secureBusinessLogin')}
              </p>
            </div>
          </div>
          
          {/* 商业用户特色元素 */}
          <div className="mt-8">
            <div className="border-l-4 border-[#FF7D00] pl-4 mb-6">
              <h3 className="text-white font-bold mb-1">{t('businessFeatures')}</h3>
              <p className="text-gray-300 text-sm">{t('businessFeaturesDescription')}</p>
            </div>
            
            <div className="flex items-center space-x-3 text-gray-300 text-sm mb-3">
              <Building2 className="h-4 w-4 text-[#FF7D00]" />
              <span>{t('businessFeaturesTool')}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-gray-300 text-sm mb-3">
              <BarChart3 className="h-4 w-4 text-[#FF7D00]" />
              <span>{t('businessFeaturesData')}</span>
            </div>
          </div>
        </div>

        {/* 右侧表单区域 */}
        <Card className="w-full md:w-3/5 border-0 rounded-none bg-[#051220]">
          <CardHeader className="pt-0 pb-4">
            <h1 className="text-2xl font-bold text-center text-white flex items-center justify-center">
              <Lock className="mr-2 h-5 w-5 text-[#FF7D00]" />
              {t('businessRegister')}
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
                  {t('businessEmail')} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border rounded-md bg-[#0A1929] border-[#132F4C] pl-3 pr-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-white">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-0 py-2 flex-1 bg-transparent text-white border-none focus:outline-none"
                    disabled={isRegisterLoading}
                    placeholder={t('enterBusinessEmail')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  {t('businessName')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-[#0A1929] border-[#132F4C] text-white"
                  disabled={isRegisterLoading}
                  placeholder={t('enterBusinessName')}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="password" className="block text-sm font-medium">
                    {t('password')} <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="flex items-center border rounded-md bg-[#0A1929] border-[#132F4C] pl-3 pr-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-white">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-0 py-2 flex-1 border rounded-md bg-[#0A1929] border-[#132F4C] text-white border-none focus:outline-none"
                    placeholder={t('enterPassword')}
                    disabled={isRegisterLoading}
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
            
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium">
                  {t('confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border rounded-md bg-[#0A1929] border-[#132F4C] pl-3 pr-0 w-full focus-within:outline-none focus-within:ring-2 focus-within:ring-white">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-0 py-2 flex-1 border rounded-md bg-[#0A1929] border-[#132F4C] text-white border-none focus:outline-none"
                    placeholder={t('confirmPasswordPlaceholder')}
                    disabled={isRegisterLoading}
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
              
              <Button
                type="submit"
                variant="orange"
                className="w-full py-3 px-4 rounded-md font-medium bg-[#FF7D00] text-white hover:bg-[#E57200] transition-colors disabled:opacity-50 mt-6"
                disabled={isRegisterLoading}
              >
                {isRegisterLoading 
                  ? t('signingInAsBusiness') 
                  : t('signInAsBusiness')}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="text-center">
            <Link href="/business/login" className="text-sm">
              <span className="text-gray-500">{t('alreadyHaveAccount')}</span>{' '}<span className="text-[#FF7D00] hover:underline">{t('signIn')}</span>
            </Link>
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
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 