# Call Center Analytics Dashboard

A self-contained web application for analyzing call center interaction data. Process CSV files and visualize call flows, user paths, and analytics in an interactive dashboard.

## Two Ways to Use

### Option 1: Web Upload (Recommended - Simplest)

**Upload CSV files through the browser - all processing happens in-memory.**

1. Start the web server:
   ```bash
   cd web
   npm install
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Upload your CSV files through the web interface

4. View analytics immediately!

**Note:** Data is stored in-memory only. If you refresh the page, you'll need to re-upload. This is intentional - no databases, no cloud storage, complete privacy!

### Option 2: Python Pipeline (For Pre-Processing)

**Process CSV files locally and generate analytics files, then view them in the dashboard.**

1. Place your CSV files in the `data/` folder

2. Run the pipeline:
   ```bash
   python run.py
   ```

3. Browser opens automatically with your analytics dashboard

**Note:** This pre-processes files and saves analytics to disk. The web dashboard reads these pre-computed analytics.

## Installation

### Prerequisites

- **Node.js 18+** and npm (required for both options)
- **Python 3.7+** (only needed for Option 2)

### Setup Steps

**For Option 1 (Web Upload):**
```bash
cd web
npm install
```

**For Option 2 (Python Pipeline):**
```bash
# Install Python dependencies (uses standard library only)
pip install -r requirements.txt

# Install Node.js dependencies
cd web
npm install
cd ..
```

## CSV Format Requirements

Your CSV files must include these columns:

| Column | Description | Required |
|--------|-------------|----------|
| `call_id` | Unique identifier for each call | ✅ Yes |
| `call_date` | Date of the call | ✅ Yes |
| `rule_id` | Node identifier | ✅ Yes |
| `rule_parent_id` | Parent node identifier (0 for root) | ✅ Yes |
| `rule_text` | Display text for the node | ✅ Yes |
| `popUpURL` | Optional URL associated with the node | ❌ No |

## Features

### Analytics Dashboard

- **Summary**: Overview metrics and top intents
- **Path Explorer**: Interactive drill-down through call flows
- **Top Paths**: Most common call sequences
- **Top Intents**: Most frequent intents
- **Node Funnel**: Node progression funnel
- **Depth Funnel**: Call depth analysis
- **Entropy & Complexity**: Measure of user choice uncertainty
- **Dead Ends**: Nodes where calls frequently terminate
- **Leaf Frequency**: Leaf node frequency
- **Duplicates**: Duplicate detection
- **Coverage Ratio**: How concentrated user choices are
- **Anomalies**: Anomaly detection
- **Unreachable Nodes**: Nodes that are never reached
- **Weekday Trends**: Call volume by day of week
- **URL Engagement**: URL engagement analysis

### Interactive Features

- **Path Explorer**: Click through the call flow tree
- **Color-coded Entropy**: Visual indicators for complexity
- **Hebrew RTL Support**: Full right-to-left text support
- **Responsive Charts**: Interactive visualizations with Recharts

## Project Structure

```
callsDB/
├── data/                    # 📁 Place CSV files here (for Python pipeline)
├── analytics/               # 📊 Generated analytics (Python pipeline)
├── json/                    # 📄 Intermediate JSON files (Python pipeline)
├── run.py                   # 🚀 Python pipeline entry point
├── generate_button_tree.py  # Processes individual CSVs
├── aggregate_runs.py        # Combines all data
├── analyze_calls.py         # Generates analytics
├── requirements.txt         # Python dependencies
└── web/                     # Next.js frontend
    ├── app/                 # Pages and API routes
    ├── components/          # React components
    ├── lib/                 # Utilities and analytics logic
    └── package.json         # Node.js dependencies
```

## Architecture

### Web Upload Mode (In-Memory)
1. Upload CSV files through browser
2. Files stored in server memory (not disk)
3. Analytics generated on-demand
4. Results stored in memory
5. **Data cleared on page refresh or server restart**

### Python Pipeline Mode (Disk-Based)
1. CSV files in `data/` folder
2. Python scripts process and generate analytics
3. Analytics saved to `analytics/` folder
4. Web dashboard reads pre-computed analytics from disk
5. **Analytics persist between sessions**

## Troubleshooting

### Port 3000 Already in Use

**Windows:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

Or change the port in `web/package.json` (modify the `-p 3000` flag).

### No CSV Files Found (Python Pipeline)

- Ensure CSV files are in the `data/` folder (not subfolders)
- Check file extensions are `.csv` (case-sensitive on Linux/Mac)
- Verify CSV files have the required columns

### Session Lost After Refresh (Web Upload)

This is expected behavior! The web upload mode stores everything in memory. To persist analytics:
- Use the Python pipeline mode instead, OR
- Keep your CSV files handy to re-upload as needed

### Node.js Errors

- Ensure Node.js 18+ is installed: `node --version`
- Run `npm install` in the `web/` directory
- Clear cache: `rm -rf web/node_modules web/.next` then reinstall

## Development

### Running Individual Steps (Python Pipeline)

```bash
# Process a single CSV
python generate_button_tree.py data/your_file.csv

# Aggregate all processed files
python aggregate_runs.py

# Generate analytics
python analyze_calls.py

# Start web server only
cd web && npm run dev
```

### Cleaning Generated Files

```bash
# Remove all generated files
rm -rf analytics/ json/ *.all.json
```

Or on Windows:
```cmd
rmdir /s /q analytics json
del *.all.json
```

## Privacy & Security

- **No cloud storage** - Everything runs locally
- **No data persistence** (web upload mode) - Data cleared on restart
- **No tracking** - Your data never leaves your machine
- **Open source** - Review the code yourself

## License

[Add your license here]

## Support

[Add support/contact information here]
