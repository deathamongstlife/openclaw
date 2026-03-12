#!/usr/bin/env bash
# Collect and organize all bug fixes from agents

set -euo pipefail

OUTPUT_DIR="/tmp/claude/---modal-volumes-vo-pkwyL871BwojYJgLZ0F1rM-claude-workspace-r79767525-gmail-com-deathamongstlife-jarvis/tasks"
RESULTS_DIR="/workspace/claude-workspace/r79767525_gmail.com/deathamongstlife/jarvis/bugfix-results"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')

mkdir -p "$RESULTS_DIR"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Collecting Bug Fix Results from All Agents              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Agent definitions
declare -A AGENTS=(
  ["a5a649f"]="gateway-stability"
  ["af025b8"]="cron-system"
  ["a331f52"]="acp-runtime"
  ["ab6ffbf"]="channels"
  ["a6d4d2e"]="models-providers"
  ["af37661"]="tools-sandbox"
  ["af09190"]="ui-ux-config"
  ["a7d439b"]="docs-enhancements"
)

total_fixes=0
total_files=0

# Extract fixes from each agent
for agent_id in "${!AGENTS[@]}"; do
  category="${AGENTS[$agent_id]}"
  output_file="${OUTPUT_DIR}/${agent_id}.output"

  echo "📦 Processing: $category ($agent_id)"

  if [ ! -f "$output_file" ]; then
    echo "   ⚠️  Output file not found, skipping"
    continue
  fi

  # Create category directory
  category_dir="${RESULTS_DIR}/${category}"
  mkdir -p "$category_dir"

  # Extract summary if present
  if grep -q "Summary\|COMPLETE\|FIXED" "$output_file"; then
    echo "   ✅ Found completion markers"

    # Extract summary section
    tail -500 "$output_file" | sed -n '/Summary/,/^$/p' > "${category_dir}/summary.txt" 2>/dev/null || true

    # Count fixes mentioned
    fix_count=$(grep -c "FIXED\|✅\|SUCCESS" "${category_dir}/summary.txt" 2>/dev/null || echo 0)
    echo "   📝 $fix_count fixes reported"
    ((total_fixes += fix_count))
  fi

  # Extract file modifications (Edit/Write operations)
  grep -E '"file_path"|Edit|Write' "$output_file" | grep -o '"[^"]*"' | sed 's/"//g' | sort -u > "${category_dir}/modified-files.txt" 2>/dev/null || true
  file_count=$(wc -l < "${category_dir}/modified-files.txt" 2>/dev/null || echo 0)

  if [ "$file_count" -gt 0 ]; then
    echo "   📄 $file_count files modified"
    ((total_files += file_count))
  fi

  # Copy full output for reference
  cp "$output_file" "${category_dir}/full-output.log"

  echo ""
done

# Create master summary
cat > "${RESULTS_DIR}/MASTER_SUMMARY.md" <<EOF
# Bug Fix Campaign Results

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')
**Results Directory**: $RESULTS_DIR

---

## Summary Statistics

- **Total Fixes Applied**: $total_fixes
- **Files Modified**: $total_files
- **Categories**: ${#AGENTS[@]}
- **Agents Deployed**: ${#AGENTS[@]}

---

## Categories

EOF

for agent_id in "${!AGENTS[@]}"; do
  category="${AGENTS[$agent_id]}"
  category_dir="${RESULTS_DIR}/${category}"

  cat >> "${RESULTS_DIR}/MASTER_SUMMARY.md" <<EOF
### $category

- Agent ID: \`$agent_id\`
- Results: [\`$category_dir\`]($category_dir)

EOF

  if [ -f "${category_dir}/summary.txt" ]; then
    echo "**Summary:**" >> "${RESULTS_DIR}/MASTER_SUMMARY.md"
    echo '```' >> "${RESULTS_DIR}/MASTER_SUMMARY.md"
    head -50 "${category_dir}/summary.txt" >> "${RESULTS_DIR}/MASTER_SUMMARY.md"
    echo '```' >> "${RESULTS_DIR}/MASTER_SUMMARY.md"
  fi

  echo "" >> "${RESULTS_DIR}/MASTER_SUMMARY.md"
done

cat >> "${RESULTS_DIR}/MASTER_SUMMARY.md" <<EOF

---

## Next Steps

1. Review individual category summaries in \`$RESULTS_DIR/\`
2. Apply file modifications listed in each \`modified-files.txt\`
3. Test changes comprehensively
4. Build Jarvis with all fixes
5. Create comprehensive changelog
6. Fork to J.A.R.V.I.S.

---

## Files Organization

\`\`\`
$RESULTS_DIR/
├── MASTER_SUMMARY.md (this file)
├── gateway-stability/
│   ├── summary.txt
│   ├── modified-files.txt
│   └── full-output.log
├── cron-system/
│   ├── summary.txt
│   ├── modified-files.txt
│   └── full-output.log
├── acp-runtime/
├── channels/
├── models-providers/
├── tools-sandbox/
├── ui-ux-config/
└── docs-enhancements/
\`\`\`
EOF

echo "════════════════════════════════════════════════════════════"
echo "✅ Results collected successfully!"
echo ""
echo "📊 Summary:"
echo "   - Total fixes: $total_fixes"
echo "   - Files modified: $total_files"
echo "   - Categories: ${#AGENTS[@]}"
echo ""
echo "📁 Results saved to: $RESULTS_DIR"
echo "📄 Master summary: ${RESULTS_DIR}/MASTER_SUMMARY.md"
echo ""
echo "Next: Review results and apply fixes to codebase"
echo "════════════════════════════════════════════════════════════"
