import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { createSession } from '../../../lib/session';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Generate a session ID for this upload
        const sessionId = pathname.split('/')[0];
        
        return {
          allowedContentTypes: ['text/csv', 'application/vnd.ms-excel'],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB limit
          tokenPayload: JSON.stringify({
            sessionId,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

export const runtime = 'nodejs';

