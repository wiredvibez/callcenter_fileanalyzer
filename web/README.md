# Call Analytics Web - Client-Side Processing

React + Next.js dashboard for call center analytics. **All processing happens in your browser** - files never uploaded, no size limits, complete privacy.

## How It Works

1. **Select CSV files** from your computer
2. **Browser processes files locally** (no upload!)
3. **Analytics generated in browser** (no server calls)
4. **Results stored in browser sessionStorage** (tab-specific)
5. **Close tab = data deleted** automatically

## Features

- ✅ **100% client-side** - all processing in browser
- ✅ **No file uploads** - files never leave your machine
- ✅ **No size limits** - process files of any size
- ✅ **Complete privacy** - data stays on your computer
- ✅ **Zero server costs** - no API calls
- ✅ **Works offline** - no internet needed after page load
- ✅ **Tab-local storage** - isolated to current browser tab
- ✅ **Auto-cleanup** - data deleted when tab closes

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

4. Upload your CSV files and view analytics!

## CSV Format Requirements

Your CSV files must include these columns:
- `call_id` - Unique identifier for each call
- `call_date` - Date of the call
- `rule_id` - Node identifier
- `rule_parent_id` - Parent node identifier
- `rule_text` - Display text for the node
- `popUpURL` - Optional URL associated with the node

## Architecture

- **App Router** (`/app`) with sidebar layout
- **Client-side processing** - all CSV parsing and analytics in browser
- **Browser sessionStorage** - tab-local data storage
- **Client components** - read from sessionStorage
- **Client-side charts** - rendered with `recharts`
- **TailwindCSS** for styling + shadcn UI components
- **Zero server APIs** - completely static after build

### Data Flow (100% Client-Side)

```
User selects CSV files
  ↓
Browser reads files locally (File API)
  ↓
Browser parses CSV
  ↓
Browser generates analytics
  ↓
Browser stores in sessionStorage
  ↓
Analytics pages read from sessionStorage
  ↓
Close tab → sessionStorage auto-cleared

✓ NO UPLOADS
✓ NO SERVER CALLS
✓ FILES STAY LOCAL
```

## Pages

- `/` - Upload interface
- `/summary` - Overview analytics
- `/top-paths` - Most common call paths
- `/top-intents` - Most frequent intents
- `/node-funnel` - Node progression funnel
- `/depth-funnel` - Call depth analysis
- `/dead-ends` - Paths that end without resolution
- `/leaf-frequency` - Leaf node frequency
- `/duplicates` - Duplicate detection
- `/entropy` - Path complexity analysis
- `/coverage` - Coverage ratio
- `/anomalies` - Anomaly detection
- `/unreachable` - Unreachable nodes
- `/weekday-trends` - Weekday trends
- `/url-engagement` - URL engagement
- `/path-explorer` - Interactive path explorer

## Important Notes

### Complete Privacy
- ✅ **Files never uploaded** - stay on your computer
- ✅ **No server processing** - all done in browser
- ✅ **No data transmission** - nothing sent over network
- ✅ **Works offline** - no internet needed after page load
- ✅ **GDPR compliant** - data never leaves your machine

### Data Lifecycle
- ✅ **Tab-specific** - Each browser tab has its own data
- ✅ **Auto-deleted** - Closing tab automatically clears data
- ⚠️ **Not shared** - Can't share between tabs
- ⚠️ **Lost on refresh** - Refreshing page clears data
- ✅ **Intentional** - Privacy-first design

### No File Size Limits
- ✅ **Process large files** - 10 MB, 50 MB, 100+ MB
- ✅ **Multiple files** - no restrictions
- ✅ **Fast processing** - optimized for performance
- ✅ **No quotas** - process as much as you want

### Sidebar Features
- **Data info panel** - Shows files count and size
- **Clear button** - Manually delete data
- **Upload new button** - Start fresh analysis
- **Navigation** - All analytics pages accessible
