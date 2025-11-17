# Deploying the Session Management Fix

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

```bash
cd web
vercel deploy --prod
```

### Option 2: Deploy via Git Push

If your project is connected to Vercel via Git:

```bash
git add .
git commit -m "Fix: Migrate session storage from memory to file-based for Vercel serverless"
git push origin main
```

Vercel will automatically detect the changes and deploy.

### Option 3: Deploy via Vercel Dashboard

1. Go to your Vercel dashboard
2. Select your project
3. Click "Deployments" → "Redeploy"
4. Or push your code changes to trigger automatic deployment

## Testing the Fix

### 1. Open your deployed app
   - Go to `https://your-app.vercel.app`

### 2. Upload a CSV file
   - Select a CSV file from the `data/` directory
   - Click "Upload and Process"

### 3. Expected behavior
   - ✅ Upload should complete successfully
   - ✅ Processing should start automatically
   - ✅ You should see the analytics results
   - ❌ No more "Session not found" errors

### 4. Check Vercel logs (if issues occur)
   ```bash
   vercel logs
   ```

   Look for:
   - `[SESSION] Creating sessions directory: /tmp/sessions`
   - `[SESSION] Session stored in file: /tmp/sessions/{id}.json`
   - `[SESSION] Session found: {...}`

## Verification Checklist

- [ ] Upload completes without errors
- [ ] Processing starts automatically
- [ ] No "Session not found" errors in browser console
- [ ] Analytics data displays correctly
- [ ] Summary page shows charts and data
- [ ] Path explorer works

## Rollback (if needed)

If you need to rollback:

```bash
vercel rollback
```

Or select a previous deployment in the Vercel dashboard.

## Environment Variables

No new environment variables are needed for this fix. The `/tmp` directory is provided by Vercel automatically.

## Performance Notes

- Session files are stored in `/tmp/sessions/`
- Each session is approximately 1-5 MB depending on CSV size
- Vercel's `/tmp` has a 512 MB limit (more than enough)
- Files are automatically cleaned up after execution context expires
- No manual cleanup needed

## Troubleshooting

### Issue: Still seeing "Session not found" errors

**Check:**
1. Make sure you deployed the latest code
2. Clear browser cache and cookies
3. Check Vercel logs for file system errors
4. Verify `/tmp` directory is writable (should be by default)

**Debug commands:**
```bash
# Check latest deployment
vercel ls

# View logs
vercel logs --follow

# Check build logs
vercel logs --build
```

### Issue: ENOENT errors in logs

This means the `/tmp/sessions` directory wasn't created. The code should create it automatically, but if you see this:

1. Check Vercel runtime configuration in `vercel.json`
2. Ensure `"runtime": "nodejs"` is set in API routes
3. Verify file system permissions (shouldn't be an issue on Vercel)

### Issue: Session data too large

If CSV files are very large (>100 MB), consider:
1. Implementing file streaming instead of loading entire content
2. Using Vercel Blob storage for large files
3. Compressing session data before storing

## What Changed

### Before (In-Memory - Broken on Vercel)
```typescript
const sessions = new Map<string, Session>();
```

### After (File-Based - Works on Vercel)
```typescript
const SESSIONS_DIR = '/tmp/sessions';
fs.writeFileSync(getSessionPath(id), JSON.stringify(session));
```

## Next Steps After Deployment

1. Test with various CSV file sizes
2. Monitor Vercel function execution time
3. Check for any timeout issues (60s limit)
4. Consider adding session expiration/cleanup
5. Monitor `/tmp` usage if processing many files

## Additional Improvements (Optional)

### Add Session Cleanup

Add automatic cleanup of old sessions:

```typescript
// Clean up sessions older than 1 hour
function cleanupOldSessions() {
  const oneHourAgo = Date.now() - 3600000;
  const files = fs.readdirSync(SESSIONS_DIR);
  
  for (const file of files) {
    const filePath = path.join(SESSIONS_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime.getTime() < oneHourAgo) {
      fs.unlinkSync(filePath);
    }
  }
}
```

### Add Error Recovery

Add retry logic for file system operations:

```typescript
function readSessionWithRetry(id: string, retries = 3): Session | undefined {
  for (let i = 0; i < retries; i++) {
    try {
      return getSession(id);
    } catch (err) {
      if (i === retries - 1) throw err;
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

## Support

If you encounter issues:
1. Check Vercel logs: `vercel logs`
2. Review the session management code in `web/lib/session.ts`
3. Verify API routes are configured correctly in `vercel.json`
4. Check that both upload and process routes have `"runtime": "nodejs"`

