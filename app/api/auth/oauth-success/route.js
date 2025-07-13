import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

/**
 * Handle OAuth success and ensure user record exists in database
 */
export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.redirect('/login');
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
    
    // Redirect to homepage
    return NextResponse.redirect('/');
  } catch (error) {
    console.error('OAuth success handler error:', error);
    return NextResponse.redirect('/login?error=oauth');
  }
} 