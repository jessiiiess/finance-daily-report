#!/bin/bash

export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="/Users/jessie"

FINANCE_DATA_DIR="$HOME/Documents/finance-data"
PROJECT_DIR="$HOME/claude../finance-daily-report"
DATE=$(date +%Y-%m-%d)

SOURCE_FILE="$FINANCE_DATA_DIR/market_data_latest.json"
TARGET_FILE="$PROJECT_DIR/data/$DATE.json"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Error: $SOURCE_FILE not found"
  exit 1
fi

cp "$SOURCE_FILE" "$TARGET_FILE"
echo "Copied $SOURCE_FILE -> $TARGET_FILE"

cd "$PROJECT_DIR" || exit 1
git add "data/$DATE.json"
git commit -m "Add market data for $DATE"
git push origin main

echo "Done: pushed data for $DATE"
