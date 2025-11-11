# Vercel Deployment Guide

## Overview

The Call Center Analytics application is now a fully hostable web application that can be deployed to Vercel. Users can upload CSV files through a web interface, and the system processes them to generate analytics.

## Architecture

```
User Upload → Vercel Blob Storage → Processing API → Analytics Generation → Shareable Link
```

## Prerequisites

1. Vercel account (free tier works)
2. Node.js 18+ installed locally for testing

## Local Setup

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the `web` directory:

```env
BLOB_READ_WRITE_TOKEN=your_blob_token_here
NEXT_PUBLIC_BLOB_URL=https://your-account.public.blob.vercel-storage.com
```

You can get these tokens from:
1. Go to your Vercel dashboard
2. Create a new project or select existing
3. Go to Storage → Create Blob Store
4. Copy the `BLOB_READ_WRITE_TOKEN`

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the upload interface.

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the `web` directory:
```bash
cd web
vercel
```

4. Follow prompts:
   - Set up new project? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name? Enter a name
   - Which directory? **./** (current directory)
   - Override settings? **No**

5. Set environment variables:
```bash
vercel env add BLOB_READ_WRITE_TOKEN
```

6. Deploy to production:
```bash
vercel --prod
```

### Option 2: Deploy via GitHub

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: **web**
   - Build Command: `npm run build`
   - Output Directory: `.next`

6. Add Environment Variables:
   - `BLOB_READ_WRITE_TOKEN` - Get from Vercel Blob Storage

7. Click "Deploy"

## Setting Up Vercel Blob Storage

1. Go to your project in Vercel Dashboard
2. Navigate to **Storage** tab
3. Click **Create Database** → **Blob**
4. Name your store (e.g., "call-analytics")
5. Click **Create**
6. Copy the environment variables and add them to your project:
   - Click on the blob store
   - Copy `BLOB_READ_WRITE_TOKEN`
   - Add to project environment variables

The tokens will automatically be available in production.

## Usage Flow

### For End Users:

1. Visit your deployed URL (e.g., `your-app.vercel.app`)
2. Drag and drop CSV files or click to browse
3. Click "Process X files"
4. Wait for processing to complete
5. View analytics and copy shareable link

### Shareable Links:

Each analysis session gets a unique URL:
```
https://your-app.vercel.app/analytics/[session-id]
```

This link can be shared with anyone to view the analytics results.

## CSV Format Requirements

Your CSV files must include these columns:
- `call_id` - Unique identifier for each call
- `call_date` - Date of the call
- `rule_id` - Node identifier
- `rule_parent_id` - Parent node identifier
- `rule_text` - Display text for the node
- `popUpURL` - Optional URL associated with the node

## Configuration

### Timeout Settings

By default, API routes have a 60-second timeout. If processing larger files:

1. Upgrade to Vercel Pro (300s timeout)
2. Or implement chunked processing (coming soon)

### Storage Limits

Vercel Blob free tier includes:
- 500GB bandwidth/month
- 100GB storage

Monitor usage in Vercel Dashboard → Storage.

## Troubleshooting

### "Processing failed" Error

**Cause**: CSV parsing error or invalid format

**Solution**: 
- Check CSV has required columns
- Ensure UTF-8 encoding
- Check for malformed rows

### "Session not found" Error

**Cause**: Session expired (24 hours) or invalid ID

**Solution**: Upload files again to create new session

### Upload Stuck at "Processing"

**Cause**: Large file timeout

**Solution**:
- Break into smaller CSV files
- Upgrade to Vercel Pro for longer timeout
- Check browser console for errors

### Environment Variables Not Working

**Solution**:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `BLOB_READ_WRITE_TOKEN`
3. Redeploy: `vercel --prod`

## Current Limitations

1. **No full analytics yet**: Currently shows basic stats (files, nodes, calls)
2. **No Python analytics**: Full analytics generation from Python scripts not yet ported
3. **Session storage**: In-memory (resets on deployment) - will add Vercel KV
4. **No authentication**: All analytics are public via link

## Roadmap

### Phase 1 (Complete)
- ✅ Upload interface
- ✅ File storage (Vercel Blob)
- ✅ CSV parsing (TypeScript)
- ✅ Button tree generation
- ✅ Call paths extraction
- ✅ Shareable links

### Phase 2 (In Progress)
- 🔄 Port full analytics from Python
- 🔄 Integrate existing dashboard pages
- 🔄 Session persistence (Vercel KV)

### Phase 3 (Planned)
- ⏳ Authentication/private sessions
- ⏳ Email sharing
- ⏳ Export results (PDF/JSON)
- ⏳ Real-time processing status
- ⏳ Data retention policies

## Cost Estimates

### Free Tier (Hobby)
- Good for: Personal use, demos, small teams
- Limits: 100GB Blob storage, 60s timeout
- Cost: **$0/month**

### Pro Tier
- Good for: Production use, larger files
- Limits: More storage, 300s timeout
- Cost: **$20/month** + usage

## Support

For issues or questions:
1. Check browser console for errors
2. Review Vercel deployment logs
3. Check CSV format matches requirements

## Example Deployment

Here's a live example deployment:
```
https://call-analytics-demo.vercel.app
```

Upload sample CSV files to see the system in action!

