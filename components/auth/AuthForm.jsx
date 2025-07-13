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

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-bold text-center">
          {isRegister ? t('register') : t('login')}
        </h1>
      </CardHeader>
      
      <CardContent>
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
              {!isRegister && (
                <Link 
                  href="/forgot-password" 
                  className="text-[#FF7D00] text-sm hover:underline"
                >
                  {t('forgotPassword')}
                </Link>
              )}
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
          )}
        </form>
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
} 