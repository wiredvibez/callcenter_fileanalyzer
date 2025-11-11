# Call Center Analytics Dashboard

A self-contained web application for analyzing call center interaction data. Process CSV files and visualize call flows, user paths, and analytics in an interactive dashboard.

## Quick Start

1. **Place your CSV files** in the `data/` folder
2. **Run the application:**
   ```bash
   python run.py
   ```
3. **Browser opens automatically** with your analytics dashboard

That's it! 🎉

## Installation

### Prerequisites

- **Python 3.7+** (uses only standard library - no extra packages needed)
- **Node.js 18+** and npm

### Setup Steps

1. **Install Python dependencies** (if any):
   ```bash
   pip install -r requirements.txt
   ```
   *Note: Currently uses only Python standard library*

2. **Install Node.js dependencies:**
   ```bash
   cd web
   npm install
   cd ..
   ```

## Usage

### Basic Usage

1. **Prepare your CSV files:**
   - Place CSV files in the `data/` folder
   - Required columns: `call_id`, `call_date`, `rule_id`, `rule_parent_id`, `rule_text`, `popUpURL`

2. **Run the pipeline:**
   ```bash
   python run.py
   ```
   
   Or from the web directory:
   ```bash
   npm run start:full
   ```

3. **Access the dashboard:**
   - Browser opens automatically at `http://localhost:3000`
   - Or manually navigate to the URL

### What Happens

The `run.py` script automatically:
1. ✅ Scans `data/` folder for CSV files
2. ✅ Processes each CSV file (generates button trees and call paths)
3. ✅ Aggregates all data into combined files
4. ✅ Generates analytics (entropy, dead ends, top paths, etc.)
5. ✅ Starts the Next.js web server
6. ✅ Opens your browser

## Project Structure

```
callsDB/
├── data/                    # 📁 Place your CSV files here
├── analytics/               # 📊 Generated analytics (auto-created)
├── json/                    # 📄 Intermediate JSON files (auto-created)
├── run.py                   # 🚀 Main entry point script
├── generate_button_tree.py  # Processes individual CSVs
├── aggregate_runs.py         # Combines all data
├── analyze_calls.py         # Generates analytics
├── requirements.txt          # Python dependencies
├── README.md                # This file
└── web/                     # Next.js frontend
    ├── app/                 # Pages and components
    ├── components/          # React components
    └── package.json          # Node.js dependencies
```

## CSV Format

Your CSV files should have the following columns:

| Column | Description | Required |
|--------|-------------|----------|
| `call_id` | Unique identifier for each call | ✅ Yes |
| `call_date` | Date of the call | ✅ Yes |
| `rule_id` | Unique identifier for each interaction step | ✅ Yes |
| `rule_parent_id` | Parent rule_id (0 for root) | ✅ Yes |
| `rule_text` | Text displayed to user | ✅ Yes |
| `popUpURL` | Optional URL for popup | ❌ No |

## Features

### Analytics Dashboard

- **Summary**: Overview metrics and top intents
- **Path Explorer**: Interactive drill-down through call flows
- **Entropy & Complexity**: Measure of user choice uncertainty
- **Dead Ends**: Nodes where calls frequently terminate
- **Top Paths**: Most common call sequences
- **Weekday Trends**: Call volume by day of week
- **Coverage Ratio**: How concentrated user choices are
- **And more...**

### Interactive Features

- **Path Explorer**: Click through the call flow tree
- **Color-coded Entropy**: Visual indicators for complexity
- **Hebrew RTL Support**: Full right-to-left text support

## Troubleshooting

### Port 3000 Already in Use

If you see `EADDRINUSE: address already in use :::3000`:

**Windows:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

Or use a different port by modifying `PORT` in `run.py`.

### No CSV Files Found

- Ensure CSV files are in the `data/` folder (not subfolders)
- Check file extensions are `.csv` (case-sensitive on Linux/Mac)
- Verify CSV files have the required columns

### Python Script Errors

- Ensure Python 3.7+ is installed: `python --version`
- Check CSV format matches expected columns
- Verify file encoding is UTF-8

### Node.js Errors

- Ensure Node.js 18+ is installed: `node --version`
- Run `npm install` in the `web/` directory
- Clear cache: `rm -rf web/node_modules web/.next` then reinstall

## Development

### Running Individual Steps

If you need to run steps manually:

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

To start fresh:

```bash
# Remove all generated files
rm -rf analytics/ json/ *.all.json
```

Or on Windows:
```cmd
rmdir /s /q analytics json
del *.all.json
```

## Limitations

See the "מגבלות הניתוח" (Analysis Limitations) section in the Summary page of the dashboard for details on what data is missing and what would need to be collected.

## License

[Add your license here]

## Support

[Add support/contact information here]


