require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBoardIcons() {
  try {
    // Get all boards
    const { data: boards, error } = await supabase
      .from('boards')
      .select('id, name, slug, icon, color');

    if (error) {
      console.error('Error fetching boards:', error);
      return;
    }

    console.log('Current boards:', boards);

    // Update boards with proper icons and colors
    const updates = [
      {
        slug: 'discussatopic',
        icon: 'chat-dots',
        color: '#3B82F6'
      },
      {
        slug: 'announcements',
        icon: 'megaphone',
        color: '#F59E0B'
      },
      {
        slug: 'general',
        icon: 'users',
        color: '#8B5CF6'
      },
      {
        slug: 'general123',
        icon: 'coffee',
        color: '#EF4444'
      }
    ];

    for (const update of updates) {
      const board = boards.find(b => b.slug === update.slug);
      if (board) {
        const { error: updateError } = await supabase
          .from('boards')
          .update({
            icon: update.icon,
            color: update.color
          })
          .eq('id', board.id);

        if (updateError) {
          console.error(`Error updating board ${update.slug}:`, updateError);
        } else {
          console.log(`Successfully updated board ${update.slug} with icon: ${update.icon}, color: ${update.color}`);
        }
      }
    }

    // Fetch updated boards
    const { data: updatedBoards, error: fetchError } = await supabase
      .from('boards')
      .select('id, name, slug, icon, color');

    if (fetchError) {
      console.error('Error fetching updated boards:', fetchError);
    } else {
      console.log('Updated boards:', updatedBoards);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

updateBoardIcons();
