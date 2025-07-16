import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'image': ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
  'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'spreadsheet': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  'presentation': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
};

/**
 * GET handler for fetching files
 * Can filter by user_id, file_type, and is_public
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || session.user.id;
    const fileType = searchParams.get('file_type');
    const isPublic = searchParams.get('is_public') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Only allow admins or the user themselves to view their files
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to access these files' }, { status: 403 });
    }

    let query = supabase.from('files').select('*').eq('user_id', userId);
    
    if (fileType) {
      query = query.eq('file_type', fileType);
    }
    
    if (searchParams.has('is_public')) {
      query = query.eq('is_public', isPublic);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }

    return NextResponse.json({ 
      data,
      pagination: {
        total: count,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Unexpected error in files GET route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST handler for uploading files
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const fileType = formData.get('file_type') || 'document';
    const isPublic = formData.get('is_public') === 'true';
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` }, { status: 400 });
    }

    // Check file type
    const mimeType = file.type;
    let fileTypeCategory = null;
    
    for (const [category, mimeTypes] of Object.entries(ALLOWED_FILE_TYPES)) {
      if (mimeTypes.includes(mimeType)) {
        fileTypeCategory = category;
        break;
      }
    }

    if (!fileTypeCategory) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Generate content hash for deduplication
    const buffer = await file.arrayBuffer();
    const contentHash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    
    // Use user_id as part of the path for organization
    const filePath = `uploads/${session.user.id}/${fileTypeCategory}/${uniqueFilename}`;
    
    // Upload file to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('files')
      .upload(filePath, Buffer.from(buffer), {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });
      
    if (storageError) {
      console.error('Error uploading file to storage:', storageError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
    
    // Get public URL if isPublic is true
    let publicUrl = null;
    if (isPublic) {
      const { data: urlData } = await supabase.storage
        .from('files')
        .getPublicUrl(filePath);
      publicUrl = urlData?.publicUrl || null;
    }
    
    // Store file metadata in database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        user_id: session.user.id,
        file_name: file.name,
        file_path: filePath,
        file_type: fileTypeCategory,
        file_size: file.size,
        mime_type: mimeType,
        content_hash: contentHash,
        is_public: isPublic,
        metadata: {
          originalName: file.name,
          publicUrl: publicUrl
        },
        created_by: session.user.id
      })
      .select()
      .single();
      
    if (dbError) {
      console.error('Error inserting file record:', dbError);
      // Clean up storage if database insert fails
      await supabase.storage.from('files').remove([filePath]);
      return NextResponse.json({ error: 'Failed to save file information' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'File uploaded successfully',
      file: fileRecord
    });
  } catch (error) {
    console.error('Unexpected error in files POST route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 