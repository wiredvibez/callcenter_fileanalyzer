#!/usr/bin/env python3
"""
Single-entry point for the call center analytics pipeline.
Processes CSVs from data/ folder, generates analytics, and launches web app.
"""

import os
import sys
import subprocess
import glob
import webbrowser
import time
from pathlib import Path

# Configuration
DATA_DIR = "data"
JSON_DIR = "json"
ANALYTICS_DIR = "analytics"
WEB_DIR = "web"
PORT = 3000
BROWSER_DELAY = 5  # seconds to wait before opening browser

def print_step(message: str):
    """Print a formatted step message."""
    print(f"\n{'='*60}")
    print(f"  {message}")
    print(f"{'='*60}\n")

def check_dependencies():
    """Check if required Python packages are installed."""
    try:
        import json
        import csv
        import argparse
        import datetime
        from collections import defaultdict, Counter
        return True
    except ImportError as e:
        print(f"Error: Missing Python dependency: {e}")
        print("Please install requirements: pip install -r requirements.txt")
        return False

def find_csv_files():
    """Find all CSV files in the data directory."""
    csv_files = list(Path(DATA_DIR).glob("*.csv"))
    if not csv_files:
        print(f"Error: No CSV files found in '{DATA_DIR}' folder.")
        print(f"Please place your CSV files in: {os.path.abspath(DATA_DIR)}")
        return []
    return csv_files

def run_command(cmd: list, description: str) -> bool:
    """Run a command and return True if successful."""
    print(f"Running: {description}...")
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {description} failed")
        print(f"Command: {' '.join(cmd)}")
        print(f"Error output: {e.stderr}")
        return False

def check_port_available(port: int) -> bool:
    """Check if a port is available."""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return True
        except OSError:
            return False

def main():
    print("\n" + "="*60)
    print("  Call Center Analytics Pipeline")
    print("="*60 + "\n")

    # Step 1: Check dependencies
    print_step("Step 1: Checking dependencies")
    if not check_dependencies():
        sys.exit(1)
    print("✓ Python dependencies OK")

    # Step 2: Find CSV files
    print_step("Step 2: Scanning for CSV files")
    csv_files = find_csv_files()
    if not csv_files:
        sys.exit(1)
    print(f"✓ Found {len(csv_files)} CSV file(s):")
    for csv_file in csv_files:
        print(f"  - {csv_file.name}")

    # Step 3: Process each CSV
    print_step("Step 3: Processing CSV files")
    for i, csv_file in enumerate(csv_files, 1):
        print(f"\nProcessing {i}/{len(csv_files)}: {csv_file.name}")
        cmd = [sys.executable, "generate_button_tree.py", str(csv_file)]
        if not run_command(cmd, f"Processing {csv_file.name}"):
            print(f"Warning: Failed to process {csv_file.name}")
            continue
    print("\n✓ All CSV files processed")

    # Step 4: Aggregate runs
    print_step("Step 4: Aggregating data")
    if not run_command([sys.executable, "aggregate_runs.py"], "Aggregating runs"):
        print("Error: Aggregation failed")
        sys.exit(1)
    print("✓ Data aggregated")

    # Step 5: Generate analytics
    print_step("Step 5: Generating analytics")
    if not run_command([sys.executable, "analyze_calls.py"], "Generating analytics"):
        print("Error: Analytics generation failed")
        sys.exit(1)
    print("✓ Analytics generated")

    # Step 6: Check port
    print_step("Step 6: Starting web server")
    if not check_port_available(PORT):
        print(f"Warning: Port {PORT} is already in use.")
        response = input(f"Kill process on port {PORT}? (y/n): ").strip().lower()
        if response == 'y':
            # Try to kill process on Windows
            if sys.platform == "win32":
                subprocess.run(["netstat", "-ano"], capture_output=True)
                # User would need to manually kill or we could add more logic
                print("Please manually close the application using port 3000")
            else:
                # Linux/Mac
                subprocess.run(["lsof", "-ti", f":{PORT}", "|", "xargs", "kill", "-9"], shell=True)
        else:
            print(f"Please free port {PORT} and run again")
            sys.exit(1)

    # Step 7: Start Next.js server
    print(f"\nStarting Next.js server on port {PORT}...")
    print(f"Server will be available at: http://localhost:{PORT}")
    print(f"Browser will open automatically in {BROWSER_DELAY} seconds...")
    print("\nPress Ctrl+C to stop the server\n")

    # Change to web directory and start server
    web_path = Path(WEB_DIR)
    if not web_path.exists():
        print(f"Error: Web directory '{WEB_DIR}' not found")
        sys.exit(1)

    # Start server in background
    os.chdir(WEB_DIR)
    try:
        # Check if node_modules exists
        if not Path("node_modules").exists():
            print("Installing npm dependencies...")
            subprocess.run(["npm", "install"], check=True)

        # Open browser after delay
        def open_browser():
            time.sleep(BROWSER_DELAY)
            webbrowser.open(f"http://localhost:{PORT}")

        import threading
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()

        # Start Next.js dev server (this blocks)
        subprocess.run(["npm", "run", "dev"], check=True)
    except KeyboardInterrupt:
        print("\n\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"\nError starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()


