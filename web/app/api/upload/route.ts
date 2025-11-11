import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createSession, updateSession, saveSession } from '../../../lib/session';

const isDev = process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  console.log('[API/UPLOAD] POST request received');
  try {
    const contentType = request.headers.get('content-type') || '';
    console.log('[API/UPLOAD] Content-Type:', contentType);
    console.log('[API/UPLOAD] Environment:', isDev ? 'Development' : 'Production');

    // Handle JSON body (when files are already uploaded to Blob)
    if (contentType.includes('application/json')) {
      console.log('[API/UPLOAD] Handling JSON body (pre-uploaded files)');
      const { files } = await request.json();
      console.log('[API/UPLOAD] Files in JSON:', files?.length);

      if (!files || files.length === 0) {
        console.error('[API/UPLOAD] No files provided in JSON');
        return NextResponse.json(
          { error: 'No files provided' },
          { status: 400 }
        );
      }

      // Create session with already-uploaded files
      console.log('[API/UPLOAD] Creating session for pre-uploaded files');
      const session = createSession();
      session.files = files.map((file: any) => ({
        name: file.name,
        url: file.url,
        size: file.size,
      }));
      session.status = 'uploading';
      console.log('[API/UPLOAD] Session created:', session.id);
      console.log('[API/UPLOAD] Files in session:', session.files.length);

      // Save session to blob storage (in production)
      console.log('[API/UPLOAD] Saving session');
      await saveSession(session);

      console.log('[API/UPLOAD] Upload successful, returning session ID');
      return NextResponse.json({
        sessionId: session.id,
        files: files,
      });
    }

    // Handle FormData (legacy - for dev environment or small files)
    console.log('[API/UPLOAD] Handling FormData upload');
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    console.log('[API/UPLOAD] Files in FormData:', files.length);

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

    // In development, store files in memory
    if (isDev) {
      console.log('[API/UPLOAD] Development mode: storing files in memory');
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          console.log(`[API/UPLOAD] Reading content for: ${file.name}`);
          const content = await file.text();
          console.log(`[API/UPLOAD] Content length for ${file.name}:`, content.length);
          // Store in session (memory)
          return {
            name: file.name,
            url: `dev:///${session.id}/${file.name}`,
            content, // Store content in dev
            size: file.size,
          };
        })
      );

      console.log('[API/UPLOAD] All files read into memory');
      // Update session with files
      session.files = uploadedFiles;
      session.status = 'uploading';
      console.log('[API/UPLOAD] Saving session with files');
      await saveSession(session);

      console.log('[API/UPLOAD] Upload successful, returning session ID');
      return NextResponse.json({
        sessionId: session.id,
        files: uploadedFiles,
      });
    }

    // Production: Upload files to Vercel Blob
    console.log('[API/UPLOAD] Production mode: uploading to Blob storage');
    const uploadPromises = files.map(async (file) => {
      const pathname = `${session.id}/${file.name}`;
      console.log(`[API/UPLOAD] Uploading to Blob: ${pathname}`);
      const blob = await put(pathname, file, {
        access: 'public',
        addRandomSuffix: false,
      });
      console.log(`[API/UPLOAD] Uploaded ${file.name} to:`, blob.url);

      return {
        name: file.name,
        url: blob.url,
        size: file.size,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    console.log('[API/UPLOAD] All files uploaded to Blob');

      // Update session with files
      session.files = uploadedFiles;
      session.status = 'uploading';
      console.log('[API/UPLOAD] Saving session');
      await saveSession(session);

      console.log('[API/UPLOAD] Upload successful, returning session ID');
      return NextResponse.json({
        sessionId: session.id,
        files: uploadedFiles,
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

