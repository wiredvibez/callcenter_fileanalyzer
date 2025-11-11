# Production Deployment Fixes - Summary

## Problems Fixed

### 1. 413 Content Too Large Error
Getting **413 Content Too Large** error when uploading CSV files on Vercel production environment. This was because Vercel serverless functions have a 4.5MB request body limit.

### 2. 404 Not Found on /api/process
Getting **404 Not Found** errors when processing files. This was caused by in-memory session storage not working across different serverless function instances.

## Solutions

### Solution 1: Client-Side Direct Uploads
Implemented **client-side direct uploads** to Vercel Blob Storage, bypassing the serverless function body size limit entirely.

### Solution 2: Persistent Session Storage
Implemented **blob-based session storage** so sessions persist across different serverless function invocations.

## Changes Made

### 1. Created Upload Token API Route
**File:** `web/app/api/upload-token/route.ts`
- Generates secure upload tokens for client-side uploads
- Validates file types (CSV only)
- Sets maximum file size to 50MB
- Uses `@vercel/blob/client` handleUpload functionality

### 2. Updated Upload API Route
**File:** `web/app/api/upload/route.ts`
- Now supports two modes:
  - **JSON mode**: Accepts metadata of already-uploaded files (production)
  - **FormData mode**: Legacy upload for development/small files
- Creates session with file metadata

### 3. Updated Frontend Upload Logic
**File:** `web/app/page.tsx`
- Detects environment (production vs development)
- **Production**: Uses client-side direct upload via `@vercel/blob/client`
  - Files upload directly from browser to Blob storage
  - No serverless function body size limit
  - Supports files up to 50MB
- **Development**: Uses traditional FormData upload for easier debugging

### 4. Updated Vercel Configuration
**File:** `web/vercel.json`
- Configured specific function settings:
  - `upload/route.ts`: 60s timeout, 1GB memory
  - `process/route.ts`: 60s timeout, 3GB memory (for processing large datasets)
  - `upload-token/route.ts`: 10s timeout (token generation is fast)

### 5. Added Favicon Icon
**File:** `web/app/icon.tsx`
- Created dynamic favicon using Next.js metadata API
- Displays "CA" (Call Analytics) on blue background
- Fixes 404 favicon errors

### 6. Implemented Persistent Session Storage
**File:** `web/lib/session.ts`
- Made `getSession()` and `updateSession()` async
- Sessions now saved to Vercel Blob in production
- Still uses in-memory storage for development (faster)
- Sessions persist across serverless function invocations

**Updated Files:**
- `web/app/api/upload/route.ts` - Now saves sessions to blob
- `web/app/api/process/route.ts` - Now fetches sessions from blob

## How It Works

### Production Flow:
1. User selects CSV files in browser
2. Frontend generates unique session ID
3. For each file:
   - Frontend requests upload token from `/api/upload-token`
   - File uploads directly to Vercel Blob Storage (client-side)
   - Returns blob URL
4. Frontend sends file metadata (names, URLs, sizes) to `/api/upload`
5. Backend creates session with file references
6. Processing begins via `/api/process`

### Development Flow:
1. User selects CSV files
2. Files sent via FormData to `/api/upload`
3. Stored in memory with session
4. Processing begins immediately

## Benefits

- ✅ **No file size limit** (up to 50MB, configurable)
- ✅ **Faster uploads** (direct to blob storage, no serverless function overhead)
- ✅ **Better user experience** (progress tracking per file)
- ✅ **Cost effective** (no function execution time during upload)
- ✅ **Scalable** (handles multiple large files efficiently)

## Testing

To test the fix:

1. **Deploy to Vercel:**
   ```bash
   cd web
   vercel deploy --prod
   ```

2. **Upload a CSV file** larger than 4.5MB
3. **Verify** the upload completes successfully
4. **Check** that analytics are generated correctly

## Environment Variables Required

Make sure these are set in Vercel:
- `BLOB_READ_WRITE_TOKEN` - Automatically set by Vercel Blob Storage

## Notes

- The `@vercel/blob` package (v2.0.0+) is already installed
- Client-side uploads require public blob access for reading
- Files are organized by session ID in blob storage
- Development mode still uses in-memory storage for easier debugging

