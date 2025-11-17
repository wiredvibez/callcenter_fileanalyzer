# Call Analytics Web - Local-Only Version

React + Next.js dashboard for call center analytics. All processing happens **in-memory** - no cloud storage, no persistence.

## How It Works

1. **Upload CSV files** through the web interface
2. Files are **stored in memory** during the session
3. **Analytics are generated** and stored in memory
4. **View results** in the dashboard
5. **Refresh = restart** - you'll need to re-upload files

## Features

- ✅ In-memory file processing
- ✅ Real-time analytics generation
- ✅ Interactive dashboard with multiple views
- ✅ No data persistence (privacy-first)
- ✅ No cloud storage costs
- ✅ 100% local operation

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
- **In-memory session storage** - data persists only during runtime
- **Server-side processing** - CSV parsing and analytics generation
- **Client-side charts** - rendered with `recharts`
- **TailwindCSS** for styling + shadcn UI components

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

⚠️ **Data is NOT saved** - If you refresh the page, close the browser, or restart the server, all data will be lost. You'll need to re-upload your CSV files.

✅ This is intentional for privacy and simplicity - no databases, no cloud storage, no persistence layer needed!
