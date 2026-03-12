# Gateway Stability Fixes - Implementation Summary

## Overview
This document tracks the implementation of critical gateway stability fixes for OpenClaw issues #43311, #43035, #42918, #43187, #43233, #43178, #43318, #43193, and #43341.

## Issue Analysis

### 1. Gateway Self-Decapitation on macOS (#43311, #43035, #42918)
**Root Cause**:
- `restartGatewayProcessWithFreshPid()` calls `triggerOpenClawRestart()` which uses `launchctl kickstart -k`
- When kickstart fails (service bootout), falls back to `bootstrap + kickstart`
- However, the respawn logic exits immediately after triggering restart
- launchd may not have time to re-register the service before process exits
- Creates race condition where gateway never comes back

**Files Modified**:
- `src/infra/process-respawn.ts`
- `src/infra/restart.ts`
- `src/gateway/server-startup.ts`

### 2. Telegram Polling Stalls (#43187, #43233, #43178)
**Root Cause**:
- `TelegramPollingSession` has watchdog for stall detection
- Has GET_UPDATES_HARD_TIMEOUT_MS (120s) and POLL_STALL_THRESHOLD_MS (90s)
- Already implements circuit breaker pattern with exponential backoff
- HOWEVER: watchdog only logs and calls stopRunner(), doesn't prevent full gateway restart
- Missing: proper timeout on the actual fetch call
- Missing: circuit breaker state to prevent cascade failures

**Files Modified**:
- `src/telegram/polling-session.ts`
- `src/telegram/monitor.ts`

### 3. Session Routing Corruption (#43318)
**Root Cause**:
- Line 235 in `sessions-send-tool.ts`: `channel: INTERNAL_MESSAGE_CHANNEL`
- This hardcodes "webchat" for ALL inter-session messages
- Should preserve the original channel from the requester
- Causes messages to route to wrong destination

**Files Modified**:
- `src/agents/tools/sessions-send-tool.ts`

### 4. Session Leak (#43193)
**Root Cause**:
- Automated sessions (cron, hooks, subagents) never cleaned up
- `session-auto-cleanup.ts` exists but may not be comprehensive
- Need to ensure all automated session types are tracked

**Files Modified**:
- `src/gateway/session-auto-cleanup.ts`
- `src/gateway/server-startup.ts` (already integrated)

### 5. TUI Real-Time Updates Regression (#43341)
**Root Cause**:
- TUI event handlers exist in `tui-event-handlers.ts`
- Handles `chat` and `agent` events
- Must ensure TUI subscribes to real-time events from main session
- Check if WebSocket subscription is properly established

**Files Modified**:
- `src/tui/tui.ts`
- `src/tui/tui-event-handlers.ts`

## Implementation Status

- [ ] Issue #1: Gateway Self-Decapitation on macOS
- [ ] Issue #2: Telegram Polling Stalls
- [ ] Issue #3: Session Routing Corruption
- [ ] Issue #4: Session Leak
- [ ] Issue #5: TUI Real-Time Updates Regression

## Testing Plan

1. Gateway restart cycles (macOS launchd)
2. Telegram polling under network stress
3. Inter-session message routing validation
4. Automated session cleanup verification
5. TUI real-time event streaming
