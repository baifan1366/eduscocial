'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { useBusinessRegister } from '../../../hooks/business/useBusinessRegisterMutation';

export default function BusinessRegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactPhone: '',
    description: ''
  });
  const [formError, setFormError] = useState(null);

  const { register, isLoading, error } = useBusinessRegister();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validate form
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    try {
      // Submit registration data
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        contactPhone: formData.contactPhone,
        description: formData.description,
        role: 'business' // Set the role as business
      });
      // Registration and redirection are handled in the hook
    } catch (err) {
      setFormError(err.message || 'An error occurred during registration');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md p-8 bg-[#132F4C] rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Business Registration</h2>
          <p className="text-gray-400 mt-2">Create a new business account</p>
        </div>

        {(formError || error) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{formError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Business Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your business name"
              required
              className="bg-[#1E3A5F] border-[#2D4D6E] text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="bg-[#1E3A5F] border-[#2D4D6E] text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min. 8 characters)"
              required
              className="bg-[#1E3A5F] border-[#2D4D6E] text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              className="bg-[#1E3A5F] border-[#2D4D6E] text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="text-white">Contact Phone</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="Enter contact phone number"
              className="bg-[#1E3A5F] border-[#2D4D6E] text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Business Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about your business..."
              className="bg-[#1E3A5F] border-[#2D4D6E] text-white placeholder:text-gray-400"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF7D00] hover:bg-orange-500 text-white py-2 rounded-md mt-6"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </Button>

          <div className="text-center mt-4">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/business/login" className="text-[#FF7D00] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 