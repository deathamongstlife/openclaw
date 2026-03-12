#!/bin/bash
set -euo pipefail

# Jarvis Documentation Deployment Setup
# This script helps you deploy Jarvis docs to docs.jarvis.allyapp.cc

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Jarvis Documentation Deployment Setup${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Check if docs directory exists
if [ ! -d "docs" ]; then
    echo -e "${RED}Error: docs directory not found${NC}"
    exit 1
fi

# Check if install.sh exists
if [ ! -f "install.sh" ]; then
    echo -e "${RED}Error: install.sh not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git repository detected"
echo -e "${GREEN}✓${NC} docs/ directory found"
echo -e "${GREEN}✓${NC} install.sh found"
echo ""

# Deployment method selection
echo -e "${BOLD}Select deployment method:${NC}"
echo "  1) GitHub Pages - /docs folder (recommended)"
echo "  2) GitHub Pages - gh-pages branch"
echo "  3) Create separate installer repo"
echo "  4) Manual (I'll do it myself)"
echo ""
read -p "Choose option (1-4): " option

case $option in
    1)
        echo ""
        echo -e "${BOLD}GitHub Pages Deployment - /docs folder${NC}"
        echo ""
        echo "Next steps:"
        echo ""
        echo "1. Verify CNAME file:"
        cat docs/CNAME
        echo ""
        echo "2. Push this repository to GitHub"
        echo ""
        echo "3. Go to GitHub repository settings:"
        echo "   https://github.com/deathamongstlife/jarvis/settings/pages"
        echo ""
        echo "4. Configure GitHub Pages:"
        echo "   - Source: Deploy from a branch"
        echo "   - Branch: main"
        echo "   - Folder: /docs"
        echo ""
        echo "5. Add custom domain:"
        echo "   - Custom domain: docs.jarvis.allyapp.cc"
        echo "   - Wait for DNS check"
        echo ""
        echo "6. Add DNS records to allyapp.cc:"
        echo ""
        echo "   Type: CNAME"
        echo "   Name: docs.jarvis.allyapp.cc"
        echo "   Value: deathamongstlife.github.io"
        echo "   TTL: 3600"
        echo ""
        echo "7. For install script, add:"
        echo ""
        echo "   Type: CNAME"
        echo "   Name: jarvis.allyapp.cc"
        echo "   Value: deathamongstlife.github.io"
        echo "   TTL: 3600"
        echo ""
        echo -e "${YELLOW}Note: DNS propagation can take up to 24 hours${NC}"
        echo ""
        ;;

    2)
        echo ""
        echo -e "${BOLD}GitHub Pages Deployment - gh-pages branch${NC}"
        echo ""

        # Create gh-pages branch
        if git show-ref --verify --quiet refs/heads/gh-pages; then
            echo -e "${YELLOW}Warning: gh-pages branch already exists${NC}"
            read -p "Delete and recreate? (y/n): " confirm
            if [ "$confirm" = "y" ]; then
                git branch -D gh-pages
            else
                echo "Aborted"
                exit 0
            fi
        fi

        echo "Creating gh-pages branch..."
        git checkout --orphan gh-pages
        git rm -rf .

        # Add CNAME and install.sh
        echo "jarvis.allyapp.cc" > CNAME
        git checkout main -- install.sh
        git checkout main -- docs
        mv docs/* .
        rmdir docs

        git add .
        git commit -m "Deploy Jarvis docs to GitHub Pages"

        echo ""
        echo -e "${GREEN}✓${NC} gh-pages branch created"
        echo ""
        echo "Next steps:"
        echo ""
        echo "1. Push gh-pages branch:"
        echo "   git push -u origin gh-pages"
        echo ""
        echo "2. Go to GitHub repository settings:"
        echo "   https://github.com/deathamongstlife/jarvis/settings/pages"
        echo ""
        echo "3. Configure GitHub Pages:"
        echo "   - Source: Deploy from a branch"
        echo "   - Branch: gh-pages"
        echo "   - Folder: / (root)"
        echo ""
        echo "4. Add custom domain: docs.jarvis.allyapp.cc"
        echo ""
        echo "5. Add DNS records (see option 1)"
        echo ""

        git checkout main
        ;;

    3)
        echo ""
        echo -e "${BOLD}Create Separate Installer Repo${NC}"
        echo ""

        # Create temporary directory
        INSTALLER_DIR="jarvis-installer"
        if [ -d "../$INSTALLER_DIR" ]; then
            echo -e "${YELLOW}Warning: ../$INSTALLER_DIR already exists${NC}"
            read -p "Delete and recreate? (y/n): " confirm
            if [ "$confirm" != "y" ]; then
                echo "Aborted"
                exit 0
            fi
            rm -rf "../$INSTALLER_DIR"
        fi

        mkdir -p "../$INSTALLER_DIR"
        cp install.sh "../$INSTALLER_DIR/"
        echo "jarvis.allyapp.cc" > "../$INSTALLER_DIR/CNAME"

        cd "../$INSTALLER_DIR"
        git init
        git add .
        git commit -m "Initial commit: Jarvis installer"

        echo ""
        echo -e "${GREEN}✓${NC} Installer repo created at ../$INSTALLER_DIR"
        echo ""
        echo "Next steps:"
        echo ""
        echo "1. Create GitHub repository:"
        echo "   https://github.com/new"
        echo "   Name: jarvis-installer"
        echo ""
        echo "2. Push to GitHub:"
        echo "   cd ../$INSTALLER_DIR"
        echo "   git remote add origin https://github.com/deathamongstlife/jarvis-installer.git"
        echo "   git push -u origin main"
        echo ""
        echo "3. Enable GitHub Pages:"
        echo "   - Go to repo settings -> Pages"
        echo "   - Source: main branch, / (root)"
        echo "   - Custom domain: jarvis.allyapp.cc"
        echo ""
        echo "4. Add DNS CNAME:"
        echo "   Name: jarvis.allyapp.cc"
        echo "   Value: deathamongstlife.github.io"
        echo ""
        ;;

    4)
        echo ""
        echo -e "${BOLD}Manual Deployment${NC}"
        echo ""
        echo "See DOCS_DEPLOYMENT_GUIDE.md for detailed instructions."
        echo ""
        ;;

    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "📚 Full guide: DOCS_DEPLOYMENT_GUIDE.md"
echo "🔍 Test install: curl -fsSL https://jarvis.allyapp.cc/install.sh | head"
echo "🌐 Test docs: curl -I https://docs.jarvis.allyapp.cc"
echo ""
