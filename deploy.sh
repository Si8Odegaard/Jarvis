#!/bin/bash
echo "📦 Adding all files..."
git add -A

echo "💾 Committing..."
git commit -m "Deploy $(date)"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Pushed! Vercel is now auto-deploying. Check your Vercel URL in 30 seconds."
