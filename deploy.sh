#!/bin/bash
#
# deploy.sh — One-command deploy: switch to main, stage, commit, push.
# Always uses the main branch (never master).
#
# Usage:
#   ./deploy.sh
#
# First time only: make it executable with:
#   chmod +x deploy.sh

set -e  # Stop the script if any command fails (safer for beginners)

# Always use main — never master
BRANCH="main"

echo "=========================================="
echo "  Deploy script starting..."
echo "=========================================="
echo ""

# --- Step 0: Use the main branch (not master) ---
echo "[0/4] Switching to branch: $BRANCH ..."
if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "      Error: local branch '$BRANCH' does not exist."
  echo "      Create it with: git checkout -b $BRANCH"
  exit 1
fi
git switch "$BRANCH" 2>/dev/null || git checkout "$BRANCH"
echo "      Done — you are on $BRANCH."
echo ""

# --- Step 1: Stage all changes ---
echo "[1/4] Staging all files (git add)..."
git add -A
echo "      Done — all changed files are staged."
echo ""

# --- Step 2: Commit with today's date and time ---
# Format example: Deploy 2026-05-16 14:30:45
COMMIT_MSG="Deploy $(date '+%Y-%m-%d %H:%M:%S')"

echo "[2/4] Creating commit..."
echo "      Message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"
echo "      Done — commit created."
echo ""

# --- Step 3: Push to GitHub (always main, never master) ---
echo "[3/4] Pushing to origin $BRANCH ..."
git push origin "$BRANCH"
echo "      Done — changes are on GitHub ($BRANCH)."
echo ""

echo "=========================================="
echo "  Deploy finished successfully!"
echo "=========================================="
