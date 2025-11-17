# Serverless Session Management Fix

## Problem

When deployed to Vercel, the application was failing with "Session not found" errors during file processing. The upload would succeed, but processing would fail.

### Root Cause

The original implementation used in-memory session storage via `globalThis.__sessions__`:

```typescript
// OLD: In-memory storage
const sessions = globalThis.__sessions__ || new Map();
```

**This doesn't work on Vercel because:**

1. `/api/upload` and `/api/process` run as **separate serverless functions**
2. Each serverless function has its **own isolated memory space**
3. The `globalThis` object is **not shared between functions**
4. Session data created in `/api/upload` is **not accessible** to `/api/process`

### Flow Diagram

```
User Upload
    ↓
/api/upload (Serverless Function Instance A)
    ↓
Creates session in globalThis.__sessions__ (Memory A)
    ↓
Returns sessionId
    ↓
User clicks Process
    ↓
/api/process (Serverless Function Instance B)
    ↓
Looks for session in globalThis.__sessions__ (Memory B - EMPTY!)
    ↓
ERROR: Session not found ❌
```

## Solution

Migrated from in-memory storage to **file-based storage** using Vercel's `/tmp` directory, which is shared across serverless function invocations within the same execution context.

### Changes Made

**File: `web/lib/session.ts`**

1. **Import file system modules:**
   ```typescript
   import * as fs from 'fs';
   import * as path from 'path';
   ```

2. **Use `/tmp` directory for session storage:**
   ```typescript
   const SESSIONS_DIR = '/tmp/sessions';
   ```

3. **Persist sessions as JSON files:**
   ```typescript
   function getSessionPath(id: string): string {
     return path.join(SESSIONS_DIR, `${id}.json`);
   }
   ```

4. **Updated all session functions to use file system:**
   - `createSession()` - Creates JSON file
   - `getSession()` - Reads JSON file
   - `updateSession()` - Updates JSON file
   - `saveSession()` - Writes JSON file
   - `deleteSession()` - Deletes JSON file
   - `listSessions()` - Lists all JSON files

### How It Works Now

```
User Upload
    ↓
/api/upload (Serverless Function Instance A)
    ↓
Creates session and saves to /tmp/sessions/{sessionId}.json
    ↓
Returns sessionId
    ↓
User clicks Process
    ↓
/api/process (Serverless Function Instance B)
    ↓
Reads session from /tmp/sessions/{sessionId}.json
    ↓
SUCCESS: Session found ✅
    ↓
Processes files and updates session file
```

## About Vercel's /tmp Directory

- **Shared:** Available to all serverless functions in the same region
- **Temporary:** Cleaned up after execution context expires
- **Size limit:** 512 MB
- **Persistence:** Ephemeral (lasts for the duration of the function execution context)
- **Perfect for:** Session data, temporary file processing, caching within a single request flow

## Deployment

No additional configuration needed. The fix works automatically because:
- Node.js `fs` module is available in Vercel's Node.js runtime
- `/tmp` directory is provided by default
- No external dependencies required

## Testing

### Local Development
```bash
cd web
npm run dev
```

### Vercel Deployment
```bash
cd web
vercel deploy
```

## Alternative Solutions (Not Chosen)

1. **Vercel KV (Redis)**
   - ✅ Most robust for production
   - ❌ Requires additional setup and potential costs
   - ❌ Overkill for temporary session data

2. **Vercel Blob Storage**
   - ✅ Good for large files
   - ❌ Requires additional setup and costs
   - ❌ Not needed for JSON session data

3. **Combine upload + process into one endpoint**
   - ✅ Simple, no cross-function communication needed
   - ❌ May hit 60-second timeout for large files
   - ❌ Poor UX (no progress updates)

## Future Considerations

If the app needs:
- **Longer session persistence** → Migrate to Vercel KV
- **Multi-region deployment** → Use distributed cache (Redis)
- **Very large file storage** → Use Vercel Blob or S3
- **Session sharing across days** → Use database

For now, the `/tmp` file-based approach is the optimal balance of simplicity, performance, and zero additional cost.

