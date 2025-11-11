# Call Center Analytics - Vercel Deployment

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
```bash
cd web
npm install
```

2. **Create `.env.local` file:**
```env
BLOB_READ_WRITE_TOKEN=your_token_here
```

3. **Run development server:**
```bash
npm run dev
```

4. **Visit:** `http://localhost:3000`

## 🌐 Deploy to Vercel

### Method 1: Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd web
vercel

# Production deployment
vercel --prod
```

### Method 2: GitHub Integration

1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure:
   - **Root Directory:** `web`
   - **Framework:** Next.js
5. Add environment variable: `BLOB_READ_WRITE_TOKEN`
6. Deploy!

## 🔑 Environment Variables

### Required:
- `BLOB_READ_WRITE_TOKEN` - Get from Vercel Blob Storage

### Setup Vercel Blob:
1. Go to your Vercel project
2. Navigate to **Storage** tab
3. Create **Blob** store
4. Copy token to environment variables

## 📊 Features

### Upload & Process
- ✅ Drag & drop CSV files
- ✅ Multiple file support
- ✅ Real-time processing
- ✅ Shareable links

### Analytics
- ✅ Call paths analysis
- ✅ Button tree visualization
- ✅ Entropy & complexity metrics
- ✅ Dead ends detection
- ✅ Weekday trends
- ✅ Top intents
- ✅ Path explorer

## 🔗 URL Structure

- **Upload:** `/`
- **Results:** `/analytics/{session-id}` → redirects to `/summary?session={id}`
- **All pages support:** `?session={id}` query parameter

## 📝 CSV Format

Required columns:
```
call_id, call_date, rule_id, rule_parent_id, rule_text, popUpURL
```

## 🛠 Tech Stack

- **Framework:** Next.js 14
- **Storage:** Vercel Blob
- **UI:** React + Tailwind CSS
- **Charts:** Recharts
- **Language:** TypeScript

## 💡 Usage Flow

1. User uploads CSV files
2. Files stored in Vercel Blob
3. Processing generates analytics
4. Analytics saved per session
5. Unique shareable URL created
6. Anyone with link can view results

## ⚙️ Configuration

### Timeout Settings

Default: 60 seconds (sufficient for most files)

For larger files, upgrade to Vercel Pro (300s timeout) or split CSVs.

### Storage Limits

**Free Tier:**
- 100GB storage
- 500GB bandwidth/month

## 🐛 Troubleshooting

### "Upload failed"
- Check CSV format
- Verify file size < 50MB
- Check network connection

### "Processing failed"
- Check CSV columns
- Verify data integrity
- Check browser console

### Environment variables not working
```bash
vercel env add BLOB_READ_WRITE_TOKEN
vercel --prod
```

## 📈 Roadmap

### ✅ Phase 1 (Complete)
- Upload interface
- CSV processing (TypeScript)
- Analytics generation
- Shareable links
- All analytics pages

### 🔄 Phase 2 (In Progress)
- Session persistence with Vercel KV
- Real-time progress tracking
- Enhanced error handling

### ⏳ Phase 3 (Planned)
- Authentication
- Email sharing
- PDF exports
- Data retention policies
- Advanced analytics

## 💰 Cost

### Hobby (Free)
- ✅ Perfect for demos
- ✅ Small teams
- ✅ Development
- **Limit:** 100GB storage, 60s timeout

### Pro ($20/mo)
- ✅ Production use
- ✅ Larger files
- ✅ 300s timeout
- ✅ Priority support

## 📞 Support

For issues:
1. Check browser console
2. Review deployment logs in Vercel
3. Verify CSV format
4. Check environment variables

## 🎯 Example

Live demo: `https://call-analytics.vercel.app`

Upload sample CSVs to see it in action!

