# Gateway Stability Fixes - Implementation Plan

## Critical Issues Identified

### 1. Gateway Self-Decapitation on macOS (#43311, #43035, #42918)
**Problem**: Gateway never restarts after self-invoked restart on macOS
**Root Cause**: In `src/infra/process-respawn.ts`, the macOS launchd restart logic was updated to avoid `kickstart -k` self-invocation (which can race with launchd's bootout state machine). However, the fix made launchd rely solely on exit(0) + KeepAlive=true, which doesn't work when the gateway is invoked via SIGUSR1.

**Key Files**:
- `src/infra/process-respawn.ts` (lines 32-47)
- `src/infra/restart.ts` (SIGUSR1 emission and authorization)

**Fix Strategy**:
- Detect when running under launchd and ensure proper restart signaling
- Add fallback detection for supervisor state
- Ensure SIGUSR1 restart cycle is properly consumed to prevent hanging

---

### 2. Telegram Polling Stalls (#43187, #43233, #43178)
**Problem**: Telegram polling stalls completely, causing message blockage
**Root Cause**: In `src/telegram/polling-session.ts`, the watchdog detects stalls after 90s without a getUpdates call, but the recovery mechanism relies on exponential backoff that can become too slow. Additionally, network errors in unhandled rejection handlers may not properly restart the runner.

**Key Files**:
- `src/telegram/polling-session.ts` (watchdog at lines 201-213)
- `src/telegram/monitor.ts` (unhandled rejection handler lines 79-98)

**Fix Strategy**:
- Add explicit timeout handling to getUpdates calls
- Improve stall detection and recovery logic
- Add health reporting for polling status
- Ensure network error recovery restarts polling properly

---

### 3. Session Routing Corruption (#43318)
**Problem**: sessions_send silently drops/routes messages to wrong channels
**Root Cause**: The session routing logic doesn't validate that the resolved session key matches the intended target, and error handling doesn't surface routing failures.

**Key Files**:
- `src/gateway/session-utils.ts` (session resolution)
- `src/agents/tools/sessions-send-tool.ts` (tool implementation)
- Auto-reply routing in `src/auto-reply/reply/session.ts`

**Fix Strategy**:
- Add validation that resolved sessionKey matches expected target
- Add logging for all routing decisions
- Surface routing errors instead of silently failing
- Add session key normalization validation

---

### 4. Session Leak - Cron/Subagents Never Cleaned Up (#43193)
**Problem**: Sessions from cron jobs and subagents accumulate forever, never cleaned up
**Root Cause**: `src/gateway/session-reset-service.ts` only handles explicit session resets/deletes, but automated sessions (cron, subagents) are never marked for cleanup when their work completes.

**Key Files**:
- `src/gateway/session-reset-service.ts`
- `src/gateway/server-cron.ts` (cron session management)
- `src/agents/subagent-registry.ts` (subagent lifecycle)

**Fix Strategy**:
- Implement session lifecycle tracking for automated sessions
- Add TTL-based cleanup for stale automated sessions
- Emit lifecycle events when cron/subagent sessions end
- Hook into existing cleanup infrastructure

---

## Implementation Order

1. **Telegram Polling** - Most user-visible, frequent issue
2. **Session Routing** - Data corruption risk
3. **Session Cleanup** - Resource leak, grows over time
4. **Gateway Restart** - Less frequent but critical

## Testing Requirements

Each fix must include:
- Unit tests covering the specific failure case
- Integration tests for end-to-end flow
- Logging to verify fix is working
- Backwards compatibility verification
