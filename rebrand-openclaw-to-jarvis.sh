#!/bin/bash
set -euo pipefail

# Bulk Rebranding Script: jarvis → jarvis
# This script handles all case variations and preserves file structure
# Generated: 2026-03-12

REPO_ROOT="${1:-.}"
DRY_RUN="${DRY_RUN:-false}"

cd "$REPO_ROOT"

echo "═══════════════════════════════════════════════════════════"
echo "  Jarvis → Jarvis Rebranding Script"
echo "═══════════════════════════════════════════════════════════"
echo "Repository: $(pwd)"
echo "Dry run: $DRY_RUN"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
files_changed=0
total_replacements=0

# Function to perform replacements in a file
rebrand_file() {
    local file="$1"
    local temp_file="${file}.rebrand.tmp"
    local changes=0

    # Skip binary files, images, and certain directories
    if [[ "$file" =~ \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|zip|tar|gz|bz2|xz|pdf|dylib|so|a|node)$ ]] || \
       [[ "$file" =~ (node_modules|\.git|\.pnpm|dist|build|coverage)/ ]]; then
        return 0
    fi

    # Skip if file doesn't exist or isn't readable
    [[ ! -f "$file" ]] || [[ ! -r "$file" ]] && return 0

    # Perform case-sensitive replacements
    # Order matters: do specific cases before general ones

    if grep -q "jarvis\|Jarvis\|JARVIS\|jarvis" "$file" 2>/dev/null; then
        cp "$file" "$temp_file"

        # JARVIS → JARVIS (all caps)
        sed -i 's/JARVIS/JARVIS/g' "$temp_file"

        # Jarvis → Jarvis (title case)
        sed -i 's/Jarvis/Jarvis/g' "$temp_file"

        # jarvis → jarvis (lowercase)
        sed -i 's/jarvis/jarvis/g' "$temp_file"

        # jarvis → jarvis (camelCase - rare but handle it)
        sed -i 's/jarvis/jarvis/g' "$temp_file"

        # Count changes
        if ! cmp -s "$file" "$temp_file"; then
            changes=$(diff -u "$file" "$temp_file" | grep -c "^[-+]" | awk '{print int($1/2)}' || echo "1")

            if [[ "$DRY_RUN" == "true" ]]; then
                echo -e "${YELLOW}[DRY RUN]${NC} Would change: $file ($changes replacements)"
            else
                mv "$temp_file" "$file"
                echo -e "${GREEN}✓${NC} Changed: $file ($changes replacements)"
            fi

            files_changed=$((files_changed + 1))
            total_replacements=$((total_replacements + changes))
        else
            rm "$temp_file"
        fi
    fi
}

# Export function for parallel execution
export -f rebrand_file
export DRY_RUN files_changed total_replacements GREEN YELLOW RED NC

echo "Scanning for files to rebrand..."
echo ""

# Find all files and process them
# Exclude common binary/build directories
find . -type f \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    ! -path "*/coverage/*" \
    ! -path "*/.next/*" \
    ! -path "*/.pnpm/*" \
    ! -path "*/target/*" \
    ! -path "*/.turbo/*" \
    -print0 | while IFS= read -r -d '' file; do
    rebrand_file "$file"
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Rebranding Summary"
echo "═══════════════════════════════════════════════════════════"
echo "Files changed: $files_changed"
echo "Total replacements: $total_replacements"

if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    echo -e "${YELLOW}This was a dry run. No files were modified.${NC}"
    echo "To apply changes, run: DRY_RUN=false $0"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  File/Directory Renames Needed (Manual)"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "The following items may need manual renaming:"
echo ""
echo "1. GitHub repository: deathamongstlife/jarvis → deathamongstlife/jarvis"
echo "2. npm package name in package.json: 'jarvis' → 'jarvis'"
echo "3. Binary names and CLI commands"
echo "4. URLs and domains (docs.jarvis.ai, jarvis.ai, etc.)"
echo "5. Docker image names"
echo "6. Any external references (homebrew formulas, package registries)"
echo ""
echo "Search for remaining 'jarvis' references:"
echo "  git grep -i jarvis"
echo ""

if [[ "$DRY_RUN" != "true" ]]; then
    echo -e "${GREEN}Rebranding complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review changes: git diff"
    echo "2. Test the build: pnpm build"
    echo "3. Run tests: pnpm test"
    echo "4. Update documentation"
    echo "5. Rename repository on GitHub"
    echo "6. Update package registry if published"
fi

echo "═══════════════════════════════════════════════════════════"
