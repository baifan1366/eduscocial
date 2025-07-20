'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useBusinessLogin } from '../../../hooks/business/useBusinessLoginMutation';

export default function BusinessAuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);

  const router = useRouter();
  const { login, isLoading, error } = useBusinessLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);

    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    try {
      await login({ email, password });
      // Login is handled in the hook, including redirection
    } catch (err) {
      setLoginError(err.message || 'An error occurred during login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md p-8 bg-[#132F4C] rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Business Login</h2>
          <p className="text-gray-400 mt-2">Sign in to your business account</p>
        </div>

        {(loginError || error) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{loginError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#1E3A5F] border-[#2D4D6E] text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#1E3A5F] border-[#2D4D6E] text-white placeholder:text-gray-400"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF7D00] hover:bg-orange-500 text-white py-2 rounded-md"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center mt-4">
            <p className="text-gray-400">
              Don't have a business account?{' '}
              <Link href="/business/register" className="text-[#FF7D00] hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 