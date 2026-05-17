#!/bin/bash
#
# deploy.sh — One-command deploy: stage, commit, and push to GitHub.
#
# Usage:
#   ./deploy.sh
#
# First time only: make it executable with:
#   chmod +x deploy.sh

set -e  # Stop the script if any command fails (safer for beginners)

echo "=========================================="
echo "  Deploy script starting..."
echo "=========================================="
echo ""

# --- Step 1: Stage all changes ---
echo "[1/3] Staging all files (git add)..."
git add -A
echo "      Done — all changed files are staged."
echo ""

# --- Step 2: Commit with today's date and time ---
# Format example: Deploy 2026-05-16 14:30:45
COMMIT_MSG="Deploy $(date '+%Y-%m-%d %H:%M:%S')"

echo "[2/3] Creating commit..."
echo "      Message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"
echo "      Done — commit created."
echo ""

# --- Step 3: Push to GitHub ---
echo "[3/3] Pushing to origin main..."
git push origin main
echo "      Done — changes are on GitHub."
echo ""

echo "=========================================="
echo "  Deploy finished successfully!"
echo "=========================================="
