# Session Persistence Fix

## Problem
Getting **404 Not Found** errors on `/api/process` endpoint in production. The issue was caused by **in-memory session storage** in a serverless environment.

### Why In-Memory Storage Doesn't Work on Vercel

Vercel deploys each API route as a **separate serverless function**. Each invocation can run on a different instance:

```
Request 1: /api/upload → Instance A (creates session in memory)
Request 2: /api/process → Instance B (can't access Instance A's memory)
```

Result: Session not found → 404 error

## Solution
Implemented **persistent session storage using Vercel Blob** for production environment.

## Changes Made

### 1. Updated Session Management (`web/lib/session.ts`)

#### Added Blob Storage Integration
- Imported `put` from `@vercel/blob`
- Made `getSession()` and `updateSession()` **async functions**
- Added `saveSession()` helper function

#### Environment-Specific Behavior

**Development Mode:**
```typescript
// Fast in-memory storage for local testing
sessions.set(id, session);
```

**Production Mode:**
```typescript
// Persistent blob storage for serverless
await put(`sessions/${id}/session.json`, JSON.stringify(session), {
  access: 'public',
  addRandomSuffix: false,
});
```

### 2. Updated Upload Route (`web/app/api/upload/route.ts`)

**Before:**
```typescript
updateSession(session.id, { files: uploadedFiles, status: 'uploading' });
```

**After:**
```typescript
session.files = uploadedFiles;
session.status = 'uploading';
await saveSession(session); // Persists to blob storage
```

### 3. Updated Process Route (`web/app/api/process/route.ts`)

**Before:**
```typescript
const session = getSession(sessionId);
updateSession(sessionId, { status: 'processing' });
```

**After:**
```typescript
const session = await getSession(sessionId); // Fetch from blob
await updateSession(sessionId, { status: 'processing' }); // Update blob
```

## How It Works Now

### Production Flow:

1. **Upload Phase** (`/api/upload`):
   ```
   Create session → Save to blob storage → Return session ID
   ```

2. **Process Phase** (`/api/process`):
   ```
   Fetch session from blob → Process files → Update session in blob
   ```

3. **Analytics Phase** (viewing results):
   ```
   Fetch session from blob → Load analytics data
   ```

### Session Storage Location

Sessions are stored in Vercel Blob at:
```
sessions/{sessionId}/session.json
```

Example session data:
```json
{
  "id": "abc-123-def",
  "createdAt": 1699564800000,
  "expiresAt": 1699651200000,
  "files": [
    {
      "name": "data.csv",
      "url": "https://blob.vercel-storage.com/...",
      "size": 1024000
    }
  ],
  "status": "completed",
  "analyticsUrl": "https://blob.vercel-storage.com/.../analytics.json"
}
```

## Benefits

✅ **Works across serverless instances** - No shared memory needed
✅ **Persistent** - Sessions survive between requests
✅ **Scalable** - Each instance can read/write independently
✅ **Fast in development** - Still uses in-memory storage locally
✅ **Automatic expiration** - Sessions expire after 24 hours

## Testing

### Local Development
```bash
cd web
npm run dev
# Uses in-memory storage - instant access
```

### Production
```bash
vercel deploy --prod
# Uses blob storage - works across serverless instances
```

## API Changes

### Breaking Changes
⚠️ **Functions are now async:**

```typescript
// OLD (synchronous)
const session = getSession(id);
updateSession(id, updates);

// NEW (asynchronous)
const session = await getSession(id);
await updateSession(id, updates);
```

All API routes that use these functions have been updated accordingly.

## Environment Variables

No additional environment variables needed. The `BLOB_READ_WRITE_TOKEN` is automatically provided by Vercel.

## Performance Considerations

- **Development**: In-memory storage (instant)
- **Production**: Blob storage (~50-100ms per operation)
- Sessions are cached within a single request
- Minimal overhead compared to original in-memory approach

## Future Improvements

Consider migrating to **Vercel KV** for even faster session access:
- Sub-millisecond latency
- Built-in TTL (time-to-live)
- Better for high-traffic applications

For now, Blob storage is sufficient and requires no additional setup.

