#!/bin/bash
# Quick script to push to GitLab from VPS

set -euo pipefail

echo "🚀 Pushing Jarvis to GitLab..."
echo ""

# Check we're in the right directory
if [ ! -f "deploy-jarvis-caddy.sh" ]; then
    echo "❌ Not in Jarvis repository directory"
    echo "Please run from /opt/jarvis"
    exit 1
fi

# Check if branch exists
if ! git show-ref --verify --quiet refs/heads/readme-jarvis-rebrand; then
    echo "❌ Branch 'readme-jarvis-rebrand' not found"
    echo "Please ensure you have the latest changes:"
    echo "  git fetch --all"
    echo "  git checkout readme-jarvis-rebrand"
    exit 1
fi

# Show what will be pushed
echo "📋 Commits to push:"
git log origin/main..readme-jarvis-rebrand --oneline | head -10
echo ""

# Ask for confirmation
read -p "Push to GitLab? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Cancelled"
    exit 0
fi

# Push
echo ""
echo "⬆️  Pushing to GitLab..."

if git push gitlab readme-jarvis-rebrand; then
    echo ""
    echo "✅ Successfully pushed to GitLab!"
    echo ""
    echo "Next steps:"
    echo "1. View pipeline: https://git.allyapp.cc/everest/j.a.r.v.i.s/-/pipelines"
    echo "2. Create merge request or push to main"
    echo "3. Deploy to VPS: sudo bash deploy-jarvis-caddy.sh"
    echo ""
else
    echo ""
    echo "❌ Push failed"
    echo ""
    echo "Possible solutions:"
    echo "1. Check GitLab credentials: git config --global credential.helper"
    echo "2. Use SSH instead: git remote set-url gitlab git@git.allyapp.cc:everest/j.a.r.v.i.s.git"
    echo "3. Use personal access token"
    echo ""
    echo "See PUSH_TO_GITLAB.md for detailed instructions"
    exit 1
fi
