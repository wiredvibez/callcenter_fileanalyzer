import { NextRequest, NextResponse } from 'next/server';
import { createSession, saveSession } from '../../../lib/session';

export async function POST(request: NextRequest) {
  console.log('[API/UPLOAD] POST request received');
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    console.log('[API/UPLOAD] Files received:', files.length);

    if (files.length === 0) {
      console.error('[API/UPLOAD] No files in FormData');
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log('[API/UPLOAD] File names:', files.map(f => f.name));
    console.log('[API/UPLOAD] File sizes:', files.map(f => f.size));

    // Validate files
    for (const file of files) {
      if (!file.name.endsWith('.csv')) {
        console.error('[API/UPLOAD] Invalid file type:', file.name);
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only CSV files are allowed.` },
          { status: 400 }
        );
      }
    }

    // Create session
    console.log('[API/UPLOAD] Creating session');
    const session = createSession();
    console.log('[API/UPLOAD] Session created:', session.id);

    // Store files in memory
    console.log('[API/UPLOAD] Reading files into memory');
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        console.log(`[API/UPLOAD] Reading content for: ${file.name}`);
        const content = await file.text();
        console.log(`[API/UPLOAD] Content length for ${file.name}:`, content.length);
        return {
          name: file.name,
          content,
          size: file.size,
        };
      })
    );

    console.log('[API/UPLOAD] All files read into memory');
    
    // Update session with files
    session.files = uploadedFiles;
    session.status = 'uploading';
    console.log('[API/UPLOAD] Saving session');
    saveSession(session);

    console.log('[API/UPLOAD] Upload successful, returning session ID');
    return NextResponse.json({
      sessionId: session.id,
      files: uploadedFiles.map(f => ({ name: f.name, size: f.size })),
    });
  } catch (error) {
    console.error('[API/UPLOAD] Upload error:', error);
    console.error('[API/UPLOAD] Error stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
