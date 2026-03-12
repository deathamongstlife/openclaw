# Test Plan for Channel Bug Fixes

## Overview
This document provides a comprehensive test plan for verifying the Feishu and MS Teams bug fixes.

## Test 1: Feishu Streaming Card Timeout

### Setup
```bash
# Ensure Feishu is configured with valid credentials
jarvis config get feishu
```

### Test Case 1.1: Normal Streaming (Should Pass)
**Objective**: Verify streaming works normally when API is responsive

**Steps**:
1. Send a message to Feishu bot requiring a long response
2. Observe streaming behavior
3. Verify response completes successfully

**Expected Result**:
- Streaming card appears within 2 seconds
- Text updates smoothly every 100ms
- Card closes successfully with final text
- No timeout errors in logs

**Pass Criteria**: ✅ Response delivered successfully with streaming

### Test Case 1.2: Timeout Behavior (Simulated Failure)
**Objective**: Verify timeout mechanism activates correctly

**Setup**: Temporarily break network to Feishu API endpoints

**Steps**:
1. Send message to trigger streaming
2. Observe for 30-35 seconds
3. Check logs for timeout error

**Expected Result**:
- Operation times out after ~30 seconds
- Error logged: "Card creation timed out after 30000ms"
- failureCount increments to 1
- Circuit breaker remains closed (not at threshold yet)

**Pass Criteria**: ✅ Timeout triggers correctly, failure recorded

### Test Case 1.3: Circuit Breaker Activation
**Objective**: Verify circuit breaker opens after 3 failures

**Steps**:
1. Trigger 3 consecutive streaming failures (via network issues)
2. Observe logs for circuit breaker activation
3. Attempt 4th streaming operation

**Expected Result**:
- After 3rd failure: "Circuit breaker OPEN - falling back to regular messages"
- 4th attempt: "Circuit breaker is OPEN - streaming card creation blocked"
- fallbackToRegularMessages = true
- Regular message sent instead of streaming

**Pass Criteria**: ✅ Circuit breaker opens at threshold

### Test Case 1.4: Circuit Breaker Reset
**Objective**: Verify circuit breaker resets after cooldown

**Steps**:
1. Trigger circuit breaker (3 failures)
2. Wait 65 seconds (past 60s cooldown)
3. Restore network connectivity
4. Send new message

**Expected Result**:
- Log shows: "Circuit breaker RESET - retrying streaming"
- circuitBreakerOpen = false
- failureCount = 0
- Next streaming attempt succeeds

**Pass Criteria**: ✅ Circuit resets and streaming resumes

### Test Case 1.5: Partial Failure Recovery
**Objective**: Verify success resets failure counter

**Steps**:
1. Trigger 2 failures (below threshold)
2. Restore connectivity
3. Successfully complete streaming operation
4. Observe failure counter

**Expected Result**:
- failureCount resets to 0 after success
- Circuit breaker remains closed
- Subsequent operations work normally

**Pass Criteria**: ✅ Success resets failure tracking

## Test 2: MS Teams HTML Entity Decoding

### Setup
```bash
# Ensure MS Teams is configured
jarvis config get msteams
```

### Test Case 2.1: Named Entity Decoding
**Objective**: Verify &amp; and other named entities decode correctly

**Preparation**:
Create test attachment URL with entities:
```
https://graph.microsoft.com/v1.0/me/drive/items/ABC123?select=id&amp;expand=children
```

**Steps**:
1. Send message with attachment containing &amp; in URL
2. Verify attachment downloads successfully
3. Check logs for decoded URL

**Expected Result**:
- URL decodes to: `...?select=id&expand=children`
- Attachment downloads without errors
- No 404 or 400 errors

**Pass Criteria**: ✅ Named entities decode correctly

### Test Case 2.2: Numeric Entity Decoding
**Objective**: Verify numeric entities (decimal and hex) decode

**Preparation**:
Test URLs:
```
https://example.com/file?name=John&#39;s%20File  (decimal)
https://example.com/file?name=John&#x27;s%20File  (hex)
```

**Steps**:
1. Process attachment with numeric entities
2. Verify URL decodes correctly
3. Confirm download succeeds

**Expected Result**:
- Both URLs decode apostrophe correctly
- Downloads succeed
- No URL encoding issues

**Pass Criteria**: ✅ Numeric entities decode correctly

### Test Case 2.3: Multiple Entity Types
**Objective**: Verify mixed entity types in single URL

**Preparation**:
```
https://api.com/file?q=&lt;test&amp;run&gt;&quot;value&#39;
```

**Steps**:
1. Process URL with mixed entities
2. Verify full decode

**Expected Result**:
- Decodes to: `...?q=<test&run>"value'`
- All entity types handled correctly

**Pass Criteria**: ✅ Mixed entities decode correctly

### Test Case 2.4: Inline Image with Entities
**Objective**: Verify inline image src attributes decode

**Preparation**:
HTML attachment with:
```html
<img src="https://cdn.example.com/img.png?token=abc&amp;key=xyz">
```

**Steps**:
1. Process HTML attachment
2. Extract inline image URL
3. Verify decoded URL used for download

**Expected Result**:
- src attribute decodes: `...?token=abc&key=xyz`
- Image downloads successfully

**Pass Criteria**: ✅ Inline image URLs decode correctly

## Test 3: Regression Testing

### Test Case 3.1: Feishu Non-Streaming Messages
**Objective**: Ensure non-streaming messages still work

**Steps**:
1. Send short message (no streaming trigger)
2. Verify regular message delivery
3. Confirm no timeout overhead

**Expected Result**:
- Regular messages unaffected
- No timeout wrapper called
- Performance unchanged

**Pass Criteria**: ✅ No regression in regular messages

### Test Case 3.2: MS Teams Non-Entity URLs
**Objective**: Ensure clean URLs still work

**Steps**:
1. Process attachment with clean URL (no entities)
2. Verify download succeeds
3. Confirm no decode overhead issues

**Expected Result**:
- Clean URLs pass through unchanged
- No performance impact
- Downloads succeed normally

**Pass Criteria**: ✅ No regression with clean URLs

### Test Case 3.3: Other Channels Unaffected
**Objective**: Verify fixes don't impact other channels

**Steps**:
1. Test Telegram message delivery
2. Test Discord attachments
3. Test Slack streaming

**Expected Result**:
- All other channels work normally
- No cross-channel impact
- No shared code breakage

**Pass Criteria**: ✅ Other channels unaffected

## Test 4: Error Logging Verification

### Test Case 4.1: Feishu Timeout Logs
**Objective**: Verify detailed logging for timeouts

**Steps**:
1. Trigger timeout scenario
2. Check logs for error details
3. Verify actionable information present

**Expected Result**:
```
feishu[account-id] Card creation timed out after 30000ms
feishu[account-id] Streaming failure 1/3: Error: ...
```

**Pass Criteria**: ✅ Logs provide clear debugging info

### Test Case 4.2: Circuit Breaker Logs
**Objective**: Verify circuit breaker state changes logged

**Steps**:
1. Trigger circuit breaker activation
2. Wait for reset
3. Verify all state changes logged

**Expected Result**:
```
feishu[account-id] Circuit breaker OPEN after 3 failures - falling back to regular messages
feishu[account-id] Circuit breaker RESET - retrying streaming
```

**Pass Criteria**: ✅ State transitions clearly logged

## Test 5: Performance Verification

### Test Case 5.1: Timeout Overhead
**Objective**: Measure performance impact of timeout wrapper

**Steps**:
1. Measure streaming latency before timeout (success case)
2. Compare with expected ~<1ms overhead

**Expected Result**:
- Promise.race overhead negligible
- Success path unaffected
- <1ms latency increase

**Pass Criteria**: ✅ Minimal performance impact

### Test Case 5.2: Entity Decoding Overhead
**Objective**: Measure entity decoder performance

**Steps**:
1. Benchmark decodeHtmlEntities on typical URLs
2. Compare with clean URL passthrough

**Expected Result**:
- Clean URLs: <0.01ms
- URLs with entities: <0.1ms
- Acceptable for attachment flow

**Pass Criteria**: ✅ Decoding performance acceptable

## Test Summary Report Template

```markdown
## Test Execution Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [staging/production]

### Feishu Tests
- [x] 1.1 Normal Streaming: PASS/FAIL - [notes]
- [x] 1.2 Timeout Behavior: PASS/FAIL - [notes]
- [x] 1.3 Circuit Breaker Activation: PASS/FAIL - [notes]
- [x] 1.4 Circuit Breaker Reset: PASS/FAIL - [notes]
- [x] 1.5 Partial Failure Recovery: PASS/FAIL - [notes]

### MS Teams Tests
- [x] 2.1 Named Entity Decoding: PASS/FAIL - [notes]
- [x] 2.2 Numeric Entity Decoding: PASS/FAIL - [notes]
- [x] 2.3 Multiple Entity Types: PASS/FAIL - [notes]
- [x] 2.4 Inline Image with Entities: PASS/FAIL - [notes]

### Regression Tests
- [x] 3.1 Feishu Non-Streaming: PASS/FAIL - [notes]
- [x] 3.2 MS Teams Non-Entity URLs: PASS/FAIL - [notes]
- [x] 3.3 Other Channels: PASS/FAIL - [notes]

### Performance Tests
- [x] 5.1 Timeout Overhead: PASS/FAIL - [measurement]
- [x] 5.2 Entity Decoding: PASS/FAIL - [measurement]

**Overall Result**: PASS/FAIL
**Issues Found**: [List any issues]
**Recommendations**: [Next steps]
```

## Automated Test Scripts

### Script 1: Feishu Timeout Test
```bash
#!/bin/bash
# test-feishu-timeout.sh

echo "Testing Feishu streaming timeout..."

# Start jarvis gateway in background
jarvis gateway run --bind loopback --port 18789 &
GATEWAY_PID=$!

sleep 5

# Send test message
jarvis message send --channel feishu --to <chat-id> --text "Generate a long response"

# Monitor logs for 35 seconds
timeout 35 tail -f /tmp/jarvis-gateway.log | grep -E "(timeout|circuit|failure)" &

# Wait for timeout or success
sleep 40

# Cleanup
kill $GATEWAY_PID

echo "Test complete. Check output above for timeout behavior."
```

### Script 2: MS Teams Entity Test
```typescript
// test-msteams-entities.ts
import { decodeHtmlEntities } from './extensions/msteams/src/attachments/shared.js';

const testCases = [
  {
    input: "https://example.com?a=1&amp;b=2",
    expected: "https://example.com?a=1&b=2",
    name: "Named entity &amp;"
  },
  {
    input: "https://example.com?q=&#39;test&#39;",
    expected: "https://example.com?q='test'",
    name: "Numeric entity &#39;"
  },
  {
    input: "https://example.com?q=&#x3C;tag&#x3E;",
    expected: "https://example.com?q=<tag>",
    name: "Hex entity &#x3C;"
  }
];

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  const result = decodeHtmlEntities(test.input);
  if (result === test.expected) {
    console.log(`✅ PASS: ${test.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Got: ${result}`);
    failed++;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

## Monitoring Checklist

Post-deployment monitoring:

- [ ] Feishu streaming timeout rate < 1%
- [ ] Feishu circuit breaker activations logged
- [ ] MS Teams attachment success rate > 99%
- [ ] No spike in other channel errors
- [ ] Logs contain clear debugging info
- [ ] Performance metrics within acceptable range
- [ ] User feedback positive

## Issue Tracking

If tests fail, create issues with:

1. Test case number
2. Expected vs actual result
3. Logs and stack traces
4. Environment details
5. Reproducibility steps
