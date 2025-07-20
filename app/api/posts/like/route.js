import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { updateUserInterestsFromPost } from '@/lib/recommend/userInterests'; 