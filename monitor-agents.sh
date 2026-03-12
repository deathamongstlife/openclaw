#!/usr/bin/env bash
# Agent Progress Monitor for Jarvis Bug Fix Campaign

AGENT_IDS=(
  "a5a649f"  # Gateway Stability
  "af025b8"  # Cron System
  "a331f52"  # ACP Runtime
  "ab6ffbf"  # Channels
  "a6d4d2e"  # Models/Providers
  "af37661"  # Tools/Sandbox
  "af09190"  # UI/UX/Config
  "a7d439b"  # Docs/Enhancements
)

AGENT_NAMES=(
  "Gateway Stability"
  "Cron System"
  "ACP Runtime"
  "Channels (Feishu/Telegram)"
  "Models/Providers"
  "Tools/Sandbox"
  "UI/UX/Config"
  "Docs/Enhancements"
)

OUTPUT_DIR="/tmp/claude/---modal-volumes-vo-pkwyL871BwojYJgLZ0F1rM-claude-workspace-r79767525-gmail-com-deathamongstlife-jarvis/tasks"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Jarvis Bug Fix Campaign - Agent Monitor                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Monitoring $(${#AGENT_IDS[@]}) agents..."
echo ""

check_agent_status() {
  local agent_id=$1
  local agent_name=$2
  local output_file="${OUTPUT_DIR}/${agent_id}.output"

  if [ ! -f "$output_file" ]; then
    echo "⚠️  $agent_name ($agent_id): Output file not found"
    return 1
  fi

  local file_size=$(wc -c < "$output_file" 2>/dev/null || echo 0)
  local file_size_mb=$(echo "scale=2; $file_size / 1024 / 1024" | bc)
  local line_count=$(wc -l < "$output_file" 2>/dev/null || echo 0)

  # Check for completion indicators
  local is_complete=false
  if tail -100 "$output_file" | grep -q "COMPLETE\|FINISHED\|Summary of fixes"; then
    is_complete=true
  fi

  # Check for errors
  local has_errors=false
  if tail -50 "$output_file" | grep -qi "error\|failed\|exception"; then
    has_errors=true
  fi

  # Check for active work
  local is_active=false
  local last_update=$(stat -f "%Sm" -t "%H:%M:%S" "$output_file" 2>/dev/null || stat -c "%y" "$output_file" | cut -d' ' -f2 | cut -d. -f1)

  if [ -n "$(find "$output_file" -mmin -1 2>/dev/null)" ]; then
    is_active=true
  fi

  # Status icon
  local status_icon="🔄"
  if $is_complete; then
    status_icon="✅"
  elif $has_errors; then
    status_icon="⚠️"
  elif ! $is_active; then
    status_icon="⏸️"
  fi

  printf "%s %-30s | %6s MB | %5s lines | Updated: %s\n" \
    "$status_icon" \
    "$agent_name" \
    "$file_size_mb" \
    "$line_count" \
    "$last_update"

  return 0
}

# Monitor loop
while true; do
  clear
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║   Jarvis Bug Fix Campaign - Agent Monitor                ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Last check: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""

  completed_count=0
  active_count=0

  for i in "${!AGENT_IDS[@]}"; do
    check_agent_status "${AGENT_IDS[$i]}" "${AGENT_NAMES[$i]}"

    output_file="${OUTPUT_DIR}/${AGENT_IDS[$i]}.output"
    if [ -f "$output_file" ]; then
      if tail -100 "$output_file" | grep -q "COMPLETE\|FINISHED\|Summary of fixes"; then
        ((completed_count++))
      elif [ -n "$(find "$output_file" -mmin -1 2>/dev/null)" ]; then
        ((active_count++))
      fi
    fi
  done

  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "Status: $completed_count completed | $active_count active | $((${#AGENT_IDS[@]} - completed_count - active_count)) idle"
  echo "════════════════════════════════════════════════════════════"
  echo ""
  echo "Legend: ✅ Complete | 🔄 Active | ⏸️ Idle | ⚠️ Errors"
  echo ""
  echo "Press Ctrl+C to exit"

  # Check if all agents are complete
  if [ $completed_count -eq ${#AGENT_IDS[@]} ]; then
    echo ""
    echo "🎉 ALL AGENTS COMPLETE! Ready to collect fixes."
    break
  fi

  sleep 10
done
