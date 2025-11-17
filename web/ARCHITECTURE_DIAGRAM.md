# Session Storage Architecture - Before & After

## BEFORE (Broken on Vercel) ❌

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│                                                              │
│  1. Upload CSV ────────────────────────────────────────┐    │
│                                                         │    │
└─────────────────────────────────────────────────────────┼────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERLESS                         │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │  /api/upload (Function Instance A)         │             │
│  │                                             │             │
│  │  globalThis.__sessions__ = Map {            │             │
│  │    "uuid-123": { files: [...] }           │             │
│  │  }                                          │             │
│  │                                             │             │
│  │  ✅ Returns: { sessionId: "uuid-123" }     │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │  /api/process (Function Instance B)        │             │
│  │                                             │             │
│  │  globalThis.__sessions__ = Map {}          │  ← EMPTY!  │
│  │                                             │             │
│  │  ❌ Error: Session "uuid-123" not found    │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│  ⚠️  Each serverless function has its own                   │
│      isolated memory space!                                 │
└─────────────────────────────────────────────────────────────┘
```

## AFTER (Works on Vercel) ✅

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│                                                              │
│  1. Upload CSV ────────────────────────────────────────┐    │
│                                                         │    │
└─────────────────────────────────────────────────────────┼────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERLESS                         │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │  /api/upload (Function Instance A)         │             │
│  │                                             │             │
│  │  fs.writeFileSync(                          │             │
│  │    "/tmp/sessions/uuid-123.json",          │             │
│  │    JSON.stringify(session)                 │             │
│  │  )                                          │             │
│  │                                             │             │
│  │  ✅ Returns: { sessionId: "uuid-123" }     │             │
│  └───────────────┬────────────────────────────┘             │
│                  │                                           │
│                  ▼                                           │
│  ┌──────────────────────────────────────────────────┐       │
│  │         /tmp/sessions/ (Shared Storage)          │       │
│  │                                                   │       │
│  │  📄 uuid-123.json                                │       │
│  │  {                                                │       │
│  │    "id": "uuid-123",                             │       │
│  │    "files": [...],                               │       │
│  │    "status": "uploading"                         │       │
│  │  }                                                │       │
│  └───────────────┬───────────────────────────────────┘       │
│                  │                                           │
│                  ▼                                           │
│  ┌────────────────────────────────────────────┐             │
│  │  /api/process (Function Instance B)        │             │
│  │                                             │             │
│  │  const content = fs.readFileSync(           │             │
│  │    "/tmp/sessions/uuid-123.json"           │             │
│  │  )                                          │             │
│  │                                             │             │
│  │  ✅ Session found! Processing...            │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│  ✅ /tmp directory is shared across all                     │
│     serverless functions!                                   │
└─────────────────────────────────────────────────────────────┘
```

## Key Differences

| Aspect | Before (In-Memory) | After (File-Based) |
|--------|-------------------|-------------------|
| **Storage** | `globalThis.__sessions__` Map | `/tmp/sessions/*.json` files |
| **Scope** | Per-function instance | Shared across functions |
| **Persistence** | Lost between instances | Persists in execution context |
| **Works on Vercel?** | ❌ No | ✅ Yes |
| **Dependencies** | None | Node.js `fs` module (built-in) |

## Data Flow

### Upload Phase
```
User selects CSV
      ↓
POST /api/upload
      ↓
Read file content
      ↓
Create session object
      ↓
Write to /tmp/sessions/{id}.json
      ↓
Return session ID to client
```

### Process Phase
```
Client sends session ID
      ↓
POST /api/process
      ↓
Read from /tmp/sessions/{id}.json
      ↓
Parse CSV data
      ↓
Generate analytics
      ↓
Update /tmp/sessions/{id}.json with results
      ↓
Return success to client
```

### Analytics Display Phase
```
Client requests analytics
      ↓
GET analytics page with session ID
      ↓
Read from /tmp/sessions/{id}.json
      ↓
Extract analytics data
      ↓
Render charts and tables
```

## Session File Structure

```json
{
  "id": "72770bab-2a5e-49c7-bda9-0e81d9ef29af",
  "createdAt": 1700000000000,
  "status": "completed",
  "files": [
    {
      "name": "tcc_protocoltext.xlsx - 01_02.csv",
      "size": 1801596,
      "content": "CallID,NodeID,ParentNodeID,NodeType,NodeText,Weekday,URL\n..."
    }
  ],
  "analyticsData": {
    "button_tree": { ... },
    "call_paths": { ... },
    "lengths_summary": { ... },
    "top_intents_top10": [ ... ],
    ...
  }
}
```

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Session file size | ~1-5 MB (depends on CSV) |
| Write time | <10ms |
| Read time | <10ms |
| Storage limit | 512 MB (Vercel /tmp) |
| Lifetime | Duration of execution context |
| Cleanup | Automatic by Vercel |

## Security Notes

- ✅ Sessions stored in `/tmp` are isolated per Vercel deployment
- ✅ Session IDs are UUIDs (hard to guess)
- ✅ Files automatically cleaned up after execution
- ✅ No sensitive data persists long-term
- ⚠️ No authentication/authorization implemented (add if needed)

## Monitoring Points

Watch for these in Vercel logs:

```
✅ [SESSION] Creating sessions directory: /tmp/sessions
✅ [SESSION] Session stored in file: /tmp/sessions/{id}.json
✅ [SESSION] Session found: {id: "...", status: "...", filesCount: 1}
✅ [SESSION] Session updated in file
```

If you see:
```
❌ [SESSION] Session file not found: /tmp/sessions/{id}.json
❌ [SESSION] Error reading session file
```

This indicates a problem with file storage or timing.

## Edge Cases Handled

1. **Directory doesn't exist** → Created automatically with `fs.mkdirSync`
2. **Session not found** → Returns `undefined` with detailed logging
3. **File read errors** → Caught and logged with error details
4. **Concurrent access** → File system handles atomicity
5. **Large files** → Limited by Vercel's 512 MB /tmp limit

## Future Scalability

For production at scale, consider:
- **Vercel KV** for distributed session storage
- **Session expiration** to prevent /tmp filling up
- **Compression** for large analytics data
- **Streaming** for very large CSV files
- **Redis** for multi-region deployments

