# Vercel Deployment Plan: Web-Hosted Analytics

## Overview
Transform the local analytics pipeline into a fully hosted web application on Vercel with file upload capabilities.

## Architecture Changes Required

### Current (Local)
```
User → Places CSVs in folder → Runs Python script → Views Next.js app
```

### Target (Hosted on Vercel)
```
User → Uploads CSVs via web UI → Serverless API processes → Views results in real-time
```

## Challenges & Solutions

### Challenge 1: Python Processing
**Problem:** Vercel serverless functions have limitations:
- 10-second timeout (Hobby plan), 60-second (Pro)
- 250MB max deployment size
- No persistent file system

**Solutions:**

#### Option A: Move Python to Serverless Functions (Recommended for small datasets)
- Convert Python scripts to serverless API routes
- Use Vercel's Python runtime
- Process files in-memory
- Store results in temporary storage

#### Option B: Use External Processing Service
- AWS Lambda / Google Cloud Functions for Python
- Vercel frontend + external API
- Better for large datasets

#### Option C: Rewrite Python Logic in Node.js
- Reimplement analysis in JavaScript/TypeScript
- Run entirely on Vercel
- Best performance, most work

### Challenge 2: File Storage
**Problem:** Vercel has no persistent filesystem

**Solutions:**
- **Vercel Blob Storage** - Store uploaded CSVs and results
- **AWS S3** - Alternative storage
- **In-memory processing** - For small files, process without storage

### Challenge 3: Long Processing Times
**Problem:** Large CSV files may exceed serverless timeout

**Solutions:**
- **Queue system** - Upload → Queue → Process → Notify
- **Incremental processing** - Process in chunks
- **Pre-computed demos** - Show example data immediately

## Implementation Plan

### Phase 1: Frontend Upload Interface

**New pages:**
1. **Landing page** (`/`) - Upload CSVs
2. **Processing page** (`/processing`) - Show progress
3. **Analytics page** (`/analytics/[id]`) - Show results

**Features:**
- Drag-and-drop file upload
- Multiple file support
- Progress indicators
- Shareable links

### Phase 2: Backend Processing

**Approach: Hybrid (Recommended)**
- Next.js API routes for upload handling
- Convert Python logic to TypeScript/JavaScript
- Use Vercel Blob for storage
- Generate shareable links

**API Routes:**
```
POST /api/upload          - Upload CSV files
POST /api/process         - Trigger processing
GET  /api/status/[id]     - Check processing status
GET  /api/results/[id]    - Get analytics results
```

### Phase 3: Data Persistence

**Storage Strategy:**
- **Vercel Blob** for uploaded CSVs
- **Vercel KV** (Redis) for metadata and session data
- **Generated analytics** stored in Blob, cached in KV
- **Session IDs** for shareable links

### Phase 4: Sharing & Access

**Features:**
- Generate unique URLs: `yourapp.vercel.app/analytics/{uuid}`
- Optional password protection
- Expiration dates
- View-only mode

## Technical Architecture

### Stack
```
Frontend:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Recharts (existing)

Backend:
- Next.js API Routes (Serverless)
- Vercel Blob Storage
- Vercel KV (optional, for caching)

Processing:
- JavaScript/TypeScript (rewrite Python logic)
- Or: Vercel serverless Python (with limitations)
```

### Database Schema (Vercel KV)

```typescript
// Session
{
  id: string,              // UUID
  created_at: timestamp,
  expires_at: timestamp,
  files: string[],         // Blob URLs
  status: 'uploading' | 'processing' | 'completed' | 'error',
  analytics_url: string,   // Blob URL to analytics JSON
  password?: string        // Optional
}
```

## File Structure (New)

```
callsDB/
├── app/
│   ├── page.tsx                    # Landing page with upload
│   ├── upload/
│   │   └── page.tsx                # Upload interface
│   ├── processing/
│   │   └── [id]/
│   │       └── page.tsx            # Processing status
│   ├── analytics/
│   │   └── [id]/
│   │       ├── page.tsx            # Analytics dashboard
│   │       ├── summary/page.tsx
│   │       ├── entropy/page.tsx
│   │       └── ...                 # All existing analytics pages
│   └── api/
│       ├── upload/
│       │   └── route.ts            # Handle file uploads
│       ├── process/
│       │   └── route.ts            # Process CSVs
│       └── analytics/
│           └── [id]/
│               └── route.ts        # Serve analytics data
├── lib/
│   ├── analytics/
│   │   ├── button-tree.ts          # Rewritten from Python
│   │   ├── aggregate.ts
│   │   ├── analyze.ts
│   │   └── types.ts
│   ├── storage.ts                  # Vercel Blob helpers
│   └── session.ts                  # Session management
├── components/
│   ├── upload/
│   │   ├── FileUpload.tsx
│   │   ├── ProgressBar.tsx
│   │   └── FileList.tsx
│   └── analytics/
│       └── ...                     # Existing components
└── vercel.json                     # Vercel configuration
```

## Implementation Steps

### Step 1: Create Upload Interface

**New page: `app/page.tsx`**
```typescript
- File upload component (drag-and-drop)
- Multiple file selection
- File validation (CSV, size limits)
- Upload to /api/upload
```

### Step 2: Rewrite Python Logic in TypeScript

**Priority order:**
1. `generate_button_tree.ts` - Core CSV parsing and tree building
2. `aggregate.ts` - Combine multiple files
3. `analyze.ts` - Generate all analytics

**Key functions to port:**
- CSV parsing
- Tree building
- Path analysis
- Entropy calculation
- Dead ends detection
- All other analytics

### Step 3: Create API Routes

**`/api/upload/route.ts`**
- Accept multipart/form-data
- Upload to Vercel Blob
- Create session ID
- Return session ID

**`/api/process/route.ts`**
- Fetch files from Blob
- Run analytics pipeline
- Store results in Blob
- Update session status

**`/api/analytics/[id]/route.ts`**
- Fetch analytics from Blob
- Return JSON data
- Handle caching

### Step 4: Update Analytics Pages

**Modify existing pages to:**
- Accept session ID from URL params
- Fetch data from API instead of file system
- Show loading states
- Handle errors

### Step 5: Vercel Configuration

**`vercel.json`**
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "BLOB_READ_WRITE_TOKEN": "@blob-token"
  }
}
```

### Step 6: Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd web
vercel --prod
```

## Migration Tasks

### Phase 1: Setup (Week 1)
- [ ] Install Vercel Blob & KV packages
- [ ] Create upload UI component
- [ ] Set up Vercel project
- [ ] Configure environment variables

### Phase 2: Backend (Week 2-3)
- [ ] Rewrite `generate_button_tree.py` → TypeScript
- [ ] Rewrite `aggregate_runs.py` → TypeScript
- [ ] Rewrite `analyze_calls.py` → TypeScript
- [ ] Create API routes
- [ ] Test processing pipeline

### Phase 3: Frontend (Week 4)
- [ ] Update analytics pages to use API
- [ ] Add loading states
- [ ] Create processing status page
- [ ] Add shareable link generation

### Phase 4: Polish (Week 5)
- [ ] Add error handling
- [ ] Add authentication (optional)
- [ ] Add expiration logic
- [ ] Performance optimization
- [ ] Mobile responsiveness

### Phase 5: Deploy (Week 6)
- [ ] Test on Vercel preview
- [ ] Production deployment
- [ ] Custom domain (optional)
- [ ] Monitoring setup

## Vercel Setup Commands

```bash
# Install dependencies
npm install @vercel/blob @vercel/kv

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Environment Variables (Vercel Dashboard)

```
BLOB_READ_WRITE_TOKEN=<auto-generated>
KV_URL=<auto-generated>
KV_REST_API_URL=<auto-generated>
KV_REST_API_TOKEN=<auto-generated>
KV_REST_API_READ_ONLY_TOKEN=<auto-generated>
```

## Cost Estimation (Vercel)

### Hobby Plan (Free)
- ✅ Hosting
- ✅ Serverless functions (10s timeout)
- ✅ 100GB bandwidth
- ❌ Limited Blob storage
- ❌ No KV storage

### Pro Plan ($20/month)
- ✅ 60s function timeout
- ✅ 1TB bandwidth
- ✅ Blob storage included
- ✅ KV storage included
- ✅ Password protection

**Recommendation:** Start with Hobby, upgrade if needed

## Alternative: Simplified Approach

If full rewrite is too much work:

### Option 1: Static Demo
- Pre-process sample data
- Deploy as static site
- Show "Demo Mode" banner
- Add "Upload your data" CTA → email/contact

### Option 2: Client-Side Processing
- Use Web Workers for CSV processing
- Process entirely in browser
- No backend needed
- Limited by browser memory

### Option 3: Hybrid
- Demo mode with pre-processed data
- Upload mode for custom analysis
- Best of both worlds

## Next Steps

**Immediate:**
1. Choose approach (full rewrite vs simplified)
2. Set up Vercel project
3. Create prototype upload interface

**Short-term:**
4. Port one Python script to test feasibility
5. Test with small dataset on Vercel
6. Estimate effort for full migration

**Long-term:**
7. Complete migration
8. Deploy to production
9. Set up custom domain
10. Add analytics tracking

## Risk Assessment

**High Risk:**
- Rewriting Python logic may introduce bugs
- Processing time may exceed limits
- Large files may cause memory issues

**Medium Risk:**
- Blob storage costs
- Learning curve for Vercel services

**Low Risk:**
- Frontend changes (mostly existing code)
- Deployment process (well documented)

## Recommended Path Forward

1. **Start with prototype** - Upload interface + one analysis
2. **Test on Vercel** - Validate approach and limits
3. **Incremental migration** - Port one feature at a time
4. **Keep local version** - As fallback and development tool
5. **Deploy when ready** - Thorough testing first

Would you like to proceed with this plan? We can start with Step 1 (upload interface) or discuss alternatives.

