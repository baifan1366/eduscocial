import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * Handle OAuth success and ensure user record exists in database
 */
export async function GET(request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const callbackUrl = url.searchParams.get('callbackUrl');
    
    console.log('OAuth success - Session exists:', !!session);
    console.log('OAuth success - Callback URL:', callbackUrl);
    
    // Get locale from URL path or default to 'en'
    const locale = url.pathname.split('/')[1] || 'en';
    
    if (!session?.user) {
      console.log('OAuth success - No session user, redirecting to login');
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    
    const { id, name, email, image } = session.user;
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (!existingUser) {
      // Create new user record
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      // Insert user
      await supabase
        .from('users')
        .insert({
          id,
          email,
          username,
          display_name: name,
          avatar_url: image,
          is_verified: true
        });
    } else {
      // Update existing user info
      await supabase
        .from('users')
        .update({
          display_name: name,
          avatar_url: image,
          last_login_at: new Date(),
          is_verified: true
        })
        .eq('email', email);
    }
    
    // Check if we have a provider record
    const { data: provider } = await supabase
      .from('user_providers')
      .select('id')
      .eq('user_id', id)
      .eq('provider_name', session.provider)
      .single();
      
    if (!provider) {
      // Store provider info
      await supabase
        .from('user_providers')
        .insert({
          user_id: id,
          provider_name: session.provider,
          provider_user_id: session.providerId,
          provider_email: email,
          profile_data: {
            name,
            image
          }
        });
    }
    
    // Handle redirect
    if (callbackUrl) {
      // Simple validation to prevent open redirect
      if (callbackUrl.startsWith('/') || callbackUrl.startsWith(url.origin)) {
        console.log('OAuth success - Redirecting to callback URL:', callbackUrl);
        return NextResponse.redirect(new URL(callbackUrl, request.url));
      }
    }
    
    // Default to homepage with locale
    console.log('OAuth success - Redirecting to homepage with locale:', `/${locale}`);
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
    
  } catch (error) {
    console.error('OAuth success handler error:', error);
    const locale = new URL(request.url).pathname.split('/')[1] || 'en';
    return NextResponse.redirect(new URL(`/${locale}/login?error=oauth`, request.url));
  }
} 