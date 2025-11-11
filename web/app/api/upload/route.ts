import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createSession, updateSession } from '../../../lib/session';

const isDev = process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle JSON body (when files are already uploaded to Blob)
    if (contentType.includes('application/json')) {
      const { files } = await request.json();

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: 'No files provided' },
          { status: 400 }
        );
      }

      // Create session with already-uploaded files
      const session = createSession();

      updateSession(session.id, {
        files: files.map((file: any) => ({
          name: file.name,
          url: file.url,
          size: file.size,
        })),
        status: 'uploading',
      });

      return NextResponse.json({
        sessionId: session.id,
        files: files,
      });
    }

    // Handle FormData (legacy - for dev environment or small files)
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of files) {
      if (!file.name.endsWith('.csv')) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only CSV files are allowed.` },
          { status: 400 }
        );
      }
    }

    // Create session
    const session = createSession();

    // In development, store files in memory
    if (isDev) {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const content = await file.text();
          // Store in session (memory)
          return {
            name: file.name,
            url: `dev:///${session.id}/${file.name}`,
            content, // Store content in dev
            size: file.size,
          };
        })
      );

      // Update session with files
      updateSession(session.id, {
        files: uploadedFiles,
        status: 'uploading',
      });

      return NextResponse.json({
        sessionId: session.id,
        files: uploadedFiles,
      });
    }

    // Production: Upload files to Vercel Blob
    const uploadPromises = files.map(async (file) => {
      const pathname = `${session.id}/${file.name}`;
      const blob = await put(pathname, file, {
        access: 'public',
        addRandomSuffix: false,
      });

      return {
        name: file.name,
        url: blob.url,
        size: file.size,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    // Update session with files
    updateSession(session.id, {
      files: uploadedFiles,
      status: 'uploading',
    });

    return NextResponse.json({
      sessionId: session.id,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;

