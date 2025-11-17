# Call Analytics Web - Tab-Local Version

React + Next.js dashboard for call center analytics. All data stored in **browser sessionStorage** - tab-local, auto-deleted on close.

## How It Works

1. **Upload CSV files** through the web interface
2. Files are **processed on the server**
3. **Complete analytics returned** to browser
4. **Stored in browser sessionStorage** (tab-specific)
5. **Close tab = data deleted** automatically

## Features

- ✅ **Tab-local storage** - isolated to current browser tab
- ✅ **Auto-cleanup** - data deleted when tab closes
- ✅ **No server storage** - zero server-side state
- ✅ **Privacy-first** - data never persists
- ✅ **Fast navigation** - instant access from sessionStorage
- ✅ **Simple URLs** - no session IDs needed

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
- **Browser sessionStorage** - tab-local data storage
- **Server-side processing** - CSV parsing and analytics generation
- **Client components** - read from sessionStorage
- **Client-side charts** - rendered with `recharts`
- **TailwindCSS** for styling + shadcn UI components

### Data Flow

```
User uploads CSV 
  ↓
Server processes (CSV → Analytics)
  ↓
Returns complete analytics JSON
  ↓
Client stores in sessionStorage
  ↓
Analytics pages read from sessionStorage
  ↓
Close tab → sessionStorage auto-cleared
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

### Data Lifecycle
- ✅ **Tab-specific** - Each browser tab has its own data
- ✅ **Auto-deleted** - Closing tab automatically clears data
- ⚠️ **Not shared** - Can't share between tabs
- ⚠️ **Lost on refresh** - Refreshing page clears data
- ✅ **Intentional** - Privacy-first design

### Sidebar Features
- **Data info panel** - Shows files count and size
- **Clear button** - Manually delete data
- **Upload new button** - Start fresh analysis
- **Navigation** - All analytics pages accessible

### Privacy
- ✅ No server-side storage
- ✅ No session IDs
- ✅ No cloud uploads
- ✅ Data cleared on tab close
- ✅ No cross-tab sharing
- ✅ 100% local operation
