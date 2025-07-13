'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useAuth from '../../../hooks/useAuth';
import { Card, CardHeader, CardContent, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Image from 'next/image';
import Head from 'next/head';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Failed to login. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login to EduSocial</title>
        <meta name="description" content="Login to EduSocial" />
        <meta property="og:title" content="Login to EduSocial" />
        <meta property="og:image" content="/slogan-removebg-preview.png" />
      </Head>
      <main>
        <div className="max-w-md mx-auto py-12">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-center">Login to EduSocial</h1>
            </CardHeader>
            
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-white rounded">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Student e-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md bg-[#0A1929] border-[#132F4C] text-white"
                    disabled={isLoading}
                    placeholder="Enter email"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="password" className="block text-sm font-medium">
                      Password
                    </label>
                    <Link 
                      href="/forgot-password" 
                      className="text-[#FF7D00] text-sm hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md bg-[#0A1929] border-[#132F4C] text-white"
                    disabled={isLoading}
                    placeholder="Enter password"
                  />
                </div>
                
                <Button
                  type="submit"
                  variant="orange"
                  className="w-full py-2 px-4 rounded-md font-medium bg-[#FF7D00] text-white disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>

                <div className="flex justify-center gap-2">
                  <Button
                    variant="orange"
                    className="px-4 rounded-md font-medium disabled:opacity-50 bg-transparent hover:bg-transparent"
                    disabled={isLoading}
                  >
                    <Image src="/google.png" alt="Sign in with Google" width={20} height={20} />
                  </Button>
                  <Button
                    variant="orange"
                    className="px-4 rounded-md font-medium disabled:opacity-50 bg-transparent hover:bg-transparent"
                    disabled={isLoading}
                  >
                    <Image src="/facebook.png" alt="Login with Facebook" width={20} height={20} />
                  </Button>
                  <Button
                    variant="orange"
                    className="px-4 rounded-md font-medium disabled:opacity-50 bg-transparent hover:bg-transparent"
                    disabled={isLoading}
                  >
                    <Image src="/email.png" alt="General Email Register / Sign in" width={20} height={20} />
                  </Button>
                </div>
              </form>
            </CardContent>
            
            <CardFooter className="text-center">
              <>
                <Link 
                  href="/resend-verification-letter" 
                  className="text-[#FF7D00] text-sm hover:underline"
                >
                  Did not receive verification letter?
                </Link>
                <p className="text-sm text-gray-500 mt-2">
                  By registering/sign in, you agree to comply with {' '}
                  <Link href="/terms-of-service" className="text-[#FF7D00] text-sm hover:underline">
                    EduSocial's terms of service
                  </Link>
                  {' '} and {' '}
                  <Link href="/privacy-policy" className="text-[#FF7D00] text-sm hover:underline">
                    privacy policy.
                  </Link>
                </p>
              </>
            </CardFooter>
          </Card>
        </div>
      </main>
    </>
  );
}
