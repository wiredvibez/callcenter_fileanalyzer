# Migration Plan: Single-Click Web App

## Overview
Transform the analytics pipeline into a self-contained, locally-runnable web application with a single entry point.

## Current Architecture
```
callsDB/
├── data/                    # CSV input files
├── json/                    # Intermediate JSON files
├── analytics/               # Final analytics JSON
├── generate_button_tree.py  # Process individual CSVs
├── aggregate_runs.py        # Combine JSON files
├── analyze_calls.py         # Generate analytics
└── web/                     # Next.js frontend
```

## Target Architecture
```
callsDB/
├── data/                    # User places CSVs here
├── analytics/               # Auto-generated (gitignored)
├── json/                    # Auto-generated (gitignored)
├── run.py                   # Single entry point script
├── requirements.txt         # Python dependencies
├── README.md                # User instructions
└── web/                     # Next.js frontend
```

## Implementation Steps

### Phase 1: Create Main Orchestrator Script

**File: `run.py`**
- Scans `data/` folder for all `.csv` files
- Runs `generate_button_tree.py` for each CSV
- Runs `aggregate_runs.py` to combine results
- Runs `analyze_calls.py` to generate analytics
- Starts Next.js dev server
- Opens browser automatically

**Features:**
- Progress indicators
- Error handling
- Cleanup of old files (optional)
- Port checking (ensure 3000 is available)

### Phase 2: Python Dependencies

**File: `requirements.txt`**
```
# Core dependencies
# (List all Python packages used)
```

### Phase 3: Update Package.json

**Add scripts:**
- `process`: Run Python pipeline
- `start:full`: Process + start web app
- `clean`: Clean generated files

### Phase 4: User Documentation

**File: `README.md`**
- Quick start guide
- Installation instructions
- Usage: "Place CSVs in data/, run `python run.py`"
- Troubleshooting

### Phase 5: Platform-Specific Launchers (Optional)

**Windows: `run.bat`**
**Mac/Linux: `run.sh`**

## Detailed Implementation

### 1. Main Orchestrator (`run.py`)

```python
#!/usr/bin/env python3
"""
Single-entry point for the call center analytics pipeline.
Processes CSVs, generates analytics, and launches web app.
"""

import os
import sys
import subprocess
import glob
import webbrowser
import time
from pathlib import Path

def main():
    # 1. Check Python dependencies
    # 2. Scan data/ folder for CSVs
    # 3. Run generate_button_tree.py for each CSV
    # 4. Run aggregate_runs.py
    # 5. Run analyze_calls.py
    # 6. Start Next.js server
    # 7. Open browser
    pass
```

### 2. Error Handling

- Validate CSV format
- Check for required columns
- Handle missing dependencies
- Port conflict detection
- Clear error messages

### 3. User Experience

- Progress bar or status messages
- Estimated time remaining
- Success/failure notifications
- Auto-open browser after 3-5 seconds

### 4. File Structure Changes

**Add to `.gitignore`:**
```
analytics/
json/
__pycache__/
*.pyc
web/.next/
web/node_modules/
```

## Migration Checklist

- [x] Create `run.py` orchestrator script
- [x] Create `requirements.txt`
- [x] Update `package.json` with new scripts
- [x] Create comprehensive `README.md`
- [x] Add `.gitignore` entries
- [ ] Test on clean environment
- [x] Create platform launchers (Windows `.bat` and Unix `.sh`)
- [x] Add error handling and validation
- [x] Add progress indicators
- [ ] Test with sample data

## Files Created

1. **`run.py`** - Main orchestrator script
   - Scans `data/` for CSV files
   - Runs full pipeline
   - Starts web server
   - Opens browser automatically

2. **`requirements.txt`** - Python dependencies (currently empty - uses stdlib only)

3. **`README.md`** - Comprehensive user documentation
   - Quick start guide
   - Installation instructions
   - Troubleshooting
   - CSV format specification

4. **`.gitignore`** - Excludes generated files
   - `analytics/`, `json/`, `*.all.json`
   - `node_modules/`, `.next/`
   - Python cache files

5. **`run.bat`** - Windows launcher (double-click to run)

6. **`run.sh`** - Mac/Linux launcher (make executable: `chmod +x run.sh`)

7. **Updated `web/package.json`** - Added `process` and `start:full` scripts

## User Workflow (After Migration)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   cd web && npm install
   ```

2. **Place CSV files in `data/` folder**

3. **Run the app:**
   ```bash
   python run.py
   ```
   OR
   ```bash
   npm run start:full
   ```

4. **Browser opens automatically** with analytics dashboard

## Technical Considerations

### Port Management
- Check if port 3000 is available
- Option to specify different port
- Kill existing processes if needed

### Data Validation
- Verify CSV has required columns
- Check for empty files
- Validate data types

### Performance
- Parallel processing of CSVs (if multiple)
- Progress feedback for long operations
- Memory management for large datasets

### Cross-Platform
- Windows: `.bat` launcher
- Mac/Linux: `.sh` launcher + shebang
- Python path detection

## Future Enhancements

1. **GUI Version** (optional)
   - Simple Tkinter/PyQt interface
   - Drag-and-drop CSV files
   - Visual progress

2. **Configuration File**
   - Custom port
   - Output directories
   - Processing options

3. **Incremental Updates**
   - Only process new CSVs
   - Merge with existing data

4. **Export Options**
   - PDF reports
   - Excel exports
   - API endpoints

