import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';

// GET handler to retrieve user cards
export async function GET(request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // For now, return empty cards since user_cards table doesn't exist
        // TODO: Create user_cards table or use existing user profile data
        console.log('Fetching cards for user:', session.user.id);
        
        return NextResponse.json({ cards: [] });
    } catch (error) {
        console.error('Unexpected error in cards GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST handler to create a new card
export async function POST(request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
        }

        // Validate ID format
        if (id.length > 15 || !/^[a-zA-Z0-9]+$/.test(id)) {
            return NextResponse.json({ error: 'ID must be alphanumeric and max 15 characters' }, { status: 400 });
        }

        // Validate name length
        if (name.length > 12) {
            return NextResponse.json({ error: 'Name must be max 12 characters' }, { status: 400 });
        }

        // For now, simulate card creation since user_cards table doesn't exist
        // TODO: Create user_cards table or use existing user profile data
        console.log('Creating card for user:', session.user.id, { id, name });
        
        // Simulate successful creation
        const mockCard = {
            id: `card_${Date.now()}`,
            user_id: session.user.id,
            card_id: id,
            name: name,
            created_at: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            card: mockCard
        });
    } catch (error) {
        console.error('Unexpected error in cards POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}