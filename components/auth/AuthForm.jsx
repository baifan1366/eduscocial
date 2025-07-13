'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import Image from 'next/image';
import useAuth from '../../hooks/useAuth';
import LoginLayout from '../ui/login-layout';

export default function AuthForm({ isRegister = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();
  const t = useTranslations('auth');
  
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
          router.push('/login');
        } else {
          setError(result.error || t('registrationFailed'));
        }
      } else {
        const result = await login(email, password);
        
        if (result.success) {
          router.push('/');
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
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      setError(t('oauthError', { provider }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // For traditional card view (used on smaller screens or as fallback)
  const renderCardView = () => (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-bold text-center">
          {isRegister ? t('register') : t('login')}
        </h1>
      </CardHeader>
      
      <CardContent>
        {renderForm()}
      </CardContent>
      
      <CardFooter className="text-center">
        {isRegister ? (
          <Link href="/login" className="text-[#FF7D00] hover:underline font-medium">
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
            <p className="text-sm text-gray-500 mt-2">
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
        )}
      </CardFooter>
    </Card>
  );
  
  // Form content shared between card view and layout
  const renderForm = () => (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-white rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {isRegister && (
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
        )}
        
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            {t('studentEmail')}
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
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-[#0A1929] border-[#132F4C] text-white"
            disabled={isLoading}
            placeholder={t('enterPassword')}
            minLength={6}
          />
        </div>
        
        {isRegister && (
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              {t('confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-[#0A1929] border-[#132F4C] text-white"
              disabled={isLoading}
              placeholder={t('confirmPasswordPlaceholder')}
            />
          </div>
        )}
        
        {isRegister && (
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded accent-[#FF7D00]"
              disabled={isLoading}
            />
            <label htmlFor="terms" className="ml-2 block text-sm">
              {t('agreeToTerms')}{' '}
              <Link 
                href="/terms-of-service" 
                className="text-[#FF7D00] hover:underline"
              >
                {t('termsOfService')}
              </Link>
              {' '}{t('and')}{' '}
              <Link 
                href="/privacy-policy" 
                className="text-[#FF7D00] hover:underline"
              >
                {t('privacyPolicy')}
              </Link>
            </label>
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

        {!isRegister && (
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
            <Button
              variant="orange"
              className="px-4 rounded-md font-medium disabled:opacity-50 bg-transparent hover:bg-transparent"
              disabled={isLoading}
            >
              <Image src="/email.png" alt={t('emailSignIn')} width={20} height={20} />
            </Button>
          </div>
        )}
      </form>
    </>
  );
  
  // Use the layout for login page, traditional card for registration page
  return !isRegister ? (
    <LoginLayout
      leftSection={
        <div className="max-w-md w-full text-center">
          {/* Floating Characters */}
          <div className="relative mb-8">
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#132F4C] rounded-full"></div>
            <div className="absolute -top-2 right-8 w-6 h-6 bg-[#132F4C] rounded-full"></div>
            <div className="absolute top-8 -right-4 w-8 h-8 bg-[#132F4C] rounded-full"></div>
            <div className="absolute bottom-4 -left-8 w-10 h-10 bg-[#132F4C] rounded-full"></div>
            <div className="absolute bottom-0 right-4 w-6 h-6 bg-[#132F4C] rounded-full"></div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg shadow-lg mx-auto w-48 h-48 flex items-center justify-center">
              <div className="w-32 h-32 bg-gray-300 flex items-center justify-center">
                <span className="text-xs text-gray-600">QR Code</span>
              </div>
            </div>

            {/* App Download Text */}
            <p className="mt-4 text-sm text-white">立即扫描下载 EduSocial App!</p>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl font-bold mb-2">年轻人都在 EduSocial 上讨论</h1>
          <p className="text-gray-300 mb-2">不想错过任何有趣的话题吗？</p>
          <p className="text-gray-300 mb-8">赶快加入我们吧！</p>

          {/* Browse Link */}
          <Link href="/" className="text-[#FF7D00] hover:underline mb-8 inline-block">
            先看讨论区
          </Link>

          {/* App Store Buttons */}
          <div className="flex gap-4 justify-center">
            <div className="bg-[#132F4C] px-6 py-3 rounded-lg">
              <span className="text-sm">Google Play</span>
            </div>
            <div className="bg-[#132F4C] px-6 py-3 rounded-lg">
              <span className="text-sm">App Store</span>
            </div>
          </div>
        </div>
      }
      rightSection={
        <>
          <h2 className="text-xl font-bold text-center mb-6">{t('login')}</h2>

          {/* Tab Selection */}
          <div className="mb-6">
            <div className="flex border-b border-[#132F4C]">
              <button className="flex-1 py-2 text-sm border-b-2 border-[#FF7D00] text-[#FF7D00]">
                Login Form 
              </button>
            </div>
          </div>

          {renderForm()}

          {/* Helper Links */}
          <div className="flex justify-center gap-2 text-sm text-[#FF7D00] mt-4 flex-wrap md:flex-nowrap">
            <Link href="/help" className="underline md:no-underline md:hover:underline whitespace-nowrap">帮助中心</Link>
            <span className="text-gray-300">•</span>
            <Link href="/resend-verification-letter" className="underline md:no-underline md:hover:underline whitespace-nowrap">{t('verificationLetter')}</Link>
            <span className="text-gray-300">•</span>
            <Link href="/forgot-password" className="underline md:no-underline md:hover:underline whitespace-nowrap">{t('forgotPassword')}</Link>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-6">
          By registering/logging in, you agree to abide by the <a href="#" className="text-blue-500 hover:underline">EduSocial Terms of Use</a>
          </p>
        </>
      }
    />
  ) : renderCardView();
} 