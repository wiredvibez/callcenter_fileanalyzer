import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createSession, updateSession } from '../../../lib/session';

export async function POST(request: NextRequest) {
  try {
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

    // Upload files to Vercel Blob
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
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
export const maxDuration = 60;

