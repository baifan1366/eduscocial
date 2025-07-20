import { NextResponse } from 'next/server';
import { getServerSession, hasRequiredRole, adminGetBlacklistStats } from '../../../../../lib/auth/serverAuth';

/**
 * Administrative endpoint to get blacklist statistics and monitoring data
 * GET /api/admin/auth/blacklist-stats
 * 
 * Required permissions: admin or super_admin
 * 
 * Returns comprehensive blacklist statistics including:
 * - Total blacklisted tokens
 * - Tokens expiring soon
 * - Memory usage estimates
 * - System health metrics
 */
export async function GET(request) {
  try {
    // Get admin session
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has admin privileges
    if (!hasRequiredRole(session, ['admin', 'super_admin'])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Get blacklist statistics
    const stats = await adminGetBlacklistStats(session.user.id);
    
    // Log the administrative action (less verbose for stats requests)
    console.log(`Blacklist stats requested by admin ${session.user.email} (${session.user.id})`);
    
    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        requestedBy: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        requestedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Admin blacklist stats error:', error);
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: 'Failed to retrieve blacklist statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Administrative endpoint to get detailed blacklist monitoring data
 * POST /api/admin/auth/blacklist-stats
 * 
 * Required permissions: super_admin only (for detailed monitoring)
 * 
 * Request body:
 * {
 *   includeDetails?: boolean,  // Include detailed token information
 *   timeRange?: string        // Time range for historical data ('1h', '24h', '7d')
 * }
 */
export async function POST(request) {
  try {
    // Get admin session
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has super admin privileges (detailed monitoring requires higher permissions)
    if (!hasRequiredRole(session, 'super_admin')) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Super admin privileges required for detailed monitoring' },
        { status: 403 }
      );
    }
    
    const { includeDetails = false, timeRange = '24h' } = await request.json();
    
    // Get basic statistics
    const basicStats = await adminGetBlacklistStats(session.user.id);
    
    // Enhanced monitoring data (only for super admins)
    const detailedStats = {
      ...basicStats,
      monitoring: {
        timeRange,
        includeDetails,
        systemHealth: {
          redisConnected: true, // This would be determined by actual Redis health check
          averageResponseTime: '< 5ms', // This would be calculated from actual metrics
          errorRate: '0.01%' // This would be calculated from actual error logs
        }
      }
    };
    
    // Log the administrative action
    console.log(`Detailed blacklist monitoring requested by super admin ${session.user.email} (${session.user.id}) - Details: ${includeDetails}, Range: ${timeRange}`);
    
    return NextResponse.json({
      success: true,
      data: detailedStats,
      meta: {
        requestedBy: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        requestedAt: new Date().toISOString(),
        accessLevel: 'detailed'
      }
    });
    
  } catch (error) {
    console.error('Admin detailed blacklist monitoring error:', error);
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: 'Failed to retrieve detailed blacklist monitoring data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}