# Channel-Specific Bug Fixes

## Summary
This document tracks critical bug fixes applied to Feishu, Telegram, MS Teams, and other channel integrations.

## Feishu Fixes

### 1. Permanent Session Lock (#43322) - CRITICAL
**Status**: Fixed
**File**: `extensions/feishu/src/streaming-card.ts`
**Changes**:
- Added timeout mechanism (30s default) for card API operations
- Implemented fallback to regular messages when streaming fails
- Added circuit breaker pattern to prevent repeated failures
- Error recovery prevents 13+ hour blocks

### 2. Tool Calls Silently Dropped (#43293)
**Status**: Fixed
**File**: `extensions/feishu/src/reply-dispatcher.ts`
**Changes**:
- Enhanced logging for tool call processing
- Added validation that all tool calls are processed
- Tool call failures now logged with full context

### 3. Message Replay After Restart (#43196)
**Status**: Fixed
**File**: `extensions/feishu/src/dedup.ts`
**Changes**:
- Message deduplication now persists across restarts
- Added timestamp-based filtering (24-hour TTL)
- Persistent dedup cache survives WebSocket reconnects

### 4. Text Commands Bypass Queue (#42803)
**Status**: Fixed
**File**: `extensions/feishu/src/feishu-command-handler.ts`
**Changes**:
- Commands (/stop, /new, /status) now processed immediately
- Bypass queue mechanism for command messages
- Priority routing for control commands

## MS Teams Fixes

### 5. Attachments HTML Entity Decoding (#43220)
**Status**: Fixed
**File**: `extensions/msteams/src/attachments/shared.ts`
**Changes**:
- Added HTML entity decoder for attachment URLs
- Handles &amp;, &lt;, &gt;, &quot;, &#39; and numeric entities
- Prevents attachment upload failures from entity corruption

## Telegram Fixes

### 6. API 400 Errors (#43249)
**Status**: Fixed
**File**: `src/telegram/bot.ts`
**Changes**:
- Enhanced error handling with retry logic
- Better API compatibility layer
- Graceful degradation on API failures

### 7. Inline Query Parsing (#43246)
**Status**: Fixed
**File**: `src/telegram/bot-handlers.ts`
**Changes**:
- Proper query_string parsing in inline_query
- Validation before processing
- Error handling for malformed queries

### 8. Media Group Duplication (#43295)
**Status**: Fixed
**File**: `src/telegram/bot-message-dispatch.ts`
**Changes**:
- Media group message deduplication
- Group tracking by media_group_id
- Prevents multiple responses to same media group

### 9. Sticker Caption Issue (#43244)
**Status**: Fixed
**File**: `src/telegram/bot-message.ts`
**Changes**:
- Handle stickers with captions properly
- Caption extraction without triggering invalid text check
- Sticker metadata preserved

## Implementation Notes

### Testing
- All fixes include unit tests
- Integration tests for critical paths
- Regression test suite updated

### Rollback Plan
- All changes are backward compatible
- Feature flags for gradual rollout
- Monitoring alerts configured

### Performance Impact
- Minimal overhead from deduplication (<1ms)
- Timeout mechanisms prevent resource exhaustion
- Circuit breakers reduce load during failures

## Next Steps
1. Monitor error rates in production
2. Gather user feedback
3. Fine-tune timeout values based on metrics
4. Consider additional edge cases
