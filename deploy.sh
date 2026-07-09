#!/bin/bash
set -euo pipefail

# Defensive cleanup: a previous crashed git process can leave .git/index.lock
# behind, which silently blocks `git commit` (and turns the rest of this
# script into a no-op that still prints success). Always clear it first.
rm -f .git/index.lock

echo "📦 Adding all files..."
git add -A

echo "💾 Committing (with --allow-empty so a re-deploy on a clean tree still pushes)..."
git commit --allow-empty -m "Deploy $(date)"

COMMIT_HASH=$(git rev-parse HEAD)
SHORT_HASH=$(git rev-parse --short HEAD)
echo "📌 Commit hash: $COMMIT_HASH  (short: $SHORT_HASH)"

echo "🚀 Pushing to GitHub..."
# Capture stdout+stderr WITHOUT letting set -e abort on a non-zero exit,
# so we can inspect the actual result before declaring success.
set +e
PUSH_OUTPUT=$(git push origin main 2>&1)
PUSH_EXIT=$?
set -e
echo "$PUSH_OUTPUT"

if [ "$PUSH_EXIT" -ne 0 ]; then
  echo "❌ git push FAILED (exit $PUSH_EXIT). Vercel will NOT deploy." >&2
  exit "$PUSH_EXIT"
fi

if echo "$PUSH_OUTPUT" | grep -q "Everything up-to-date"; then
  echo "❌ git push was a silent no-op (Everything up-to-date). No new commit reached GitHub." >&2
  echo "   This usually means the commit step produced no new object (check above)." >&2
  exit 1
fi

echo ""
echo "✅ Pushed $COMMIT_HASH to origin/main. Vercel is now auto-deploying."
echo "   Open Vercel & confirm a deployment appears tied to: $COMMIT_HASH"
echo "   Vercel deployments URL: https://vercel.com/dashboard → select 'Jarvis' → Deployments"
