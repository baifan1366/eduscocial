import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { generateUserInterestEmbedding } from '@/lib/userEmbedding';

/**
 * Update user embedding on demand
 * This can be triggered when a user completes significant profile changes
 * or after selecting initial interests for cold-start
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get additional options from request body
    const { forceRefresh = true, lookbackDays = 30 } = await request.json();
    
    // Generate user embedding
    const result = await generateUserInterestEmbedding(userId, {
      lookbackDays,
      storeInDb: true,
      storeInRedis: true
    });
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || result.reason || 'Failed to generate user embedding' 
        },
        { status: 400 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User embedding updated successfully',
      timestamp: new Date().toISOString(),
      embeddingGenerated: !!result.embedding
    });
    
  } catch (error) {
    console.error('Error updating user embedding:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 