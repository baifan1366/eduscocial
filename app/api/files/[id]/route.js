import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';

/**
 * GET handler for fetching a specific file
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Fetch file metadata
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching file:', error);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has access to this file
    if (file.user_id !== session.user.id && !file.is_public && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to access this file' }, { status: 403 });
    }

    // Get download URL (valid for a limited time)
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('files')
      .createSignedUrl(file.file_path, 60); // 60 seconds expiry

    if (downloadError) {
      console.error('Error generating download URL:', downloadError);
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    // Return file metadata with download URL
    return NextResponse.json({
      ...file,
      downloadUrl: downloadData?.signedUrl || null
    });
  } catch (error) {
    console.error('Unexpected error in file GET route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE handler for deleting a file
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Get file info first
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching file for deletion:', fetchError);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has permission to delete this file
    if (file.user_id !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 });
    }

    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([file.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion anyway since storage might have different lifecycle
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting file record from database:', dbError);
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 });
    }

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in file DELETE route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH handler for updating file metadata
 */
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Get file info first to check permissions
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching file for update:', fetchError);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has permission to update this file
    if (file.user_id !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to update this file' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    
    // Only allow updating certain fields
    const allowedUpdates = {
      file_name: body.file_name,
      is_public: body.is_public,
      metadata: body.metadata
    };

    // Filter out undefined values
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
    }

    // Update public URL if is_public status changed
    if (updates.is_public !== undefined && updates.is_public !== file.is_public) {
      if (updates.is_public) {
        // Get public URL if making file public
        const { data: urlData } = await supabase.storage
          .from('files')
          .getPublicUrl(file.file_path);
        
        if (urlData?.publicUrl) {
          updates.metadata = {
            ...(updates.metadata || file.metadata || {}),
            publicUrl: urlData.publicUrl
          };
        }
      } else {
        // Remove public URL if making file private
        updates.metadata = {
          ...(updates.metadata || file.metadata || {}),
          publicUrl: null
        };
      }
    }

    // Update the file record
    const { data: updatedFile, error: updateError } = await supabase
      .from('files')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating file record:', updateError);
      return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'File updated successfully',
      file: updatedFile
    });
  } catch (error) {
    console.error('Unexpected error in file PATCH route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 