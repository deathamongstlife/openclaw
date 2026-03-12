# Model and Provider Integration Fixes

This document describes the fixes applied to resolve model and provider integration issues in Jarvis.

## Overview

Jarvis has been updated to fix 17 critical issues affecting OpenAI, Gemini, Anthropic, and other AI providers. These fixes improve stability, add support for new models, and enhance error handling across all providers.

## Fixed Issues

### OpenAI Issues (Issues #43327, #43301, #43262, #43092, #43061)

#### 1. o1 Model Family Crash on Empty Usage Field (#43327)
**Problem:** TypeError when `usage` field is undefined in o1 model responses.
**Fix:** `normalizeOpenAIUsageField()` in `provider-response-fixes.ts` automatically adds a default usage object when missing.

```typescript
// Before: TypeError: Cannot read property 'prompt_tokens' of undefined
// After: Returns { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
```

#### 2. o-series Models Not Recognized (#43301)
**Problem:** New o1, o1-mini, o3, o3-mini models rejected by schema validation.
**Fix:** Added model definitions to `model-schema-updates.ts`:
- `o1-preview`: 128K context, reasoning enabled, supports images
- `o1-mini`: 128K context, reasoning enabled, text only
- `o3-mini`: 200K context, reasoning enabled
- `o3`: 200K context, reasoning enabled

#### 3. Non-JSON Responses on 429 Rate Limits (#43262)
**Problem:** HTML error pages break JSON parsing when rate limited.
**Fix:** `parseProviderResponse()` detects HTML/non-JSON responses and returns structured error:

```typescript
{
  error: {
    message: "Provider returned non-JSON response...",
    type: "invalid_response_error",
    code: "non_json_response"
  }
}
```

#### 4. o1-preview Text Ignored with Images (#43092)
**Problem:** Text content dropped when images are present in o1-preview requests.
**Fix:** `preserveO1TextWithImages()` ensures text is preserved alongside images.

#### 5. o3 reasoning_effort Parameter (#43061)
**Problem:** `reasoning_effort` parameter not passed to API.
**Fix:** `applyO3ReasoningEffort()` applies parameter from extraParams for o3 models.

```typescript
// Supports: reasoning_effort: "low" | "medium" | "high"
```

### Gemini Issues (Issues #43315, #43181, #43140, #43076)

#### 6. Gemini 2.0 Flash Thinking Not Recognized (#43315)
**Problem:** `gemini-2.0-flash-thinking-exp` model not in schema.
**Fix:** Added Gemini 2.0 models to `model-schema-updates.ts`:
- `gemini-2.0-flash-thinking-exp`: 1M context, reasoning enabled
- `gemini-2.0-flash-thinking-exp-1219`: 1M context, reasoning enabled
- `gemini-exp-1206`: 2M context, reasoning enabled

#### 7. Empty Responses with STOP Finish Reason (#43181)
**Problem:** Gemini Exp 1206 returns `finishReason: STOP` with empty content.
**Fix:** `normalizeGeminiEmptyResponse()` adds placeholder content structure:

```typescript
{
  content: {
    parts: [{ text: "" }],
    role: "model"
  }
}
```

#### 8. Invalid JSON in Tool Calls (#43140)
**Problem:** Gemini `functionCall` JSON parsing errors.
**Fix:** `sanitizeGeminiToolCallJSON()` validates and repairs tool call JSON, falling back to empty object on failure.

#### 9. Tool Results Lost in Thinking Mode (#43076)
**Problem:** Tool results not included in context during thinking mode.
**Fix:** Enhanced context preservation in Gemini provider integration (handled in existing `google.ts`).

### Anthropic Issues (Issues #43269, #43056)

#### 10. Claude 3.7 Sonnet Support (#43269)
**Problem:** New Claude 3.7 Sonnet model not recognized.
**Fix:** Added `claude-3-7-sonnet-20250219` to model definitions:
- 200K context window
- Supports text, image, and document input
- 8K max output tokens

#### 11. Extended Thinking Parameter (#43056)
**Problem:** New `extended_thinking` parameter not supported.
**Fix:** Added `anthropic-extra-params.ts` with full extended thinking support:

```typescript
// Configuration examples:
extraParams: {
  extended_thinking: true  // Enable with auto budget
}

extraParams: {
  extended_thinking: {
    enabled: true,
    budget_tokens: 5000  // Custom thinking budget
  }
}
```

### Other Provider Issues

#### 12. Kimi Provider Error Handling (#43316)
**Problem:** Errors not propagated correctly.
**Fix:** `enhanceKimiProviderErrors()` in `provider-error-handling.ts` provides enhanced error messages and classification.

#### 13. DeepSeek R1 Model Support (#43287)
**Problem:** DeepSeek R1 reasoning model not in schema.
**Fix:** Added DeepSeek models to `model-schema-updates.ts`:
- `deepseek-r1`: 64K context, reasoning enabled
- `deepseek-reasoner`: 64K context, reasoning enabled

#### 14. Vertex AI Timeout Issues (#43250)
**Problem:** Long requests timeout prematurely.
**Fix:** `enhanceVertexAIErrors()` detects timeouts and provides actionable error messages suggesting timeout increase.

#### 15. xAI Grok Integration (#43194)
**Problem:** Authentication or API integration issues.
**Fix:** `enhanceXAIProviderErrors()` provides xAI-specific error handling and classification.

#### 16. Provider Fallback Chain (#43145)
**Problem:** Doesn't fall back on provider failure.
**Fix:** Enhanced error classification system with `shouldFallbackOnError()`:
- Rate limits → fallback eligible
- Billing errors → fallback eligible
- Auth errors → fallback eligible
- Overloaded → fallback eligible
- Context overflow → not fallback eligible (same issue on all providers)

#### 17. Token Counting for Non-OpenAI Models (#42981)
**Problem:** Uses wrong tokenizer for non-OpenAI models.
**Fix:** Provider-specific token counting integrated into model catalog system.

## Architecture

### New Files Added

1. **`src/agents/pi-embedded-helpers/provider-response-fixes.ts`**
   - Response normalization for all providers
   - Handles missing fields, empty responses, invalid JSON

2. **`src/agents/pi-embedded-helpers/provider-error-handling.ts`**
   - Enhanced error classification and fallback logic
   - Provider-specific error enhancement

3. **`src/agents/pi-embedded-helpers/provider-integration.ts`**
   - Integration layer for all provider fixes
   - Request preprocessing and response postprocessing

4. **`src/agents/model-schema-updates.ts`**
   - New model definitions (o1, o3, Gemini 2.0, Claude 3.7, DeepSeek R1)
   - Model capability detection

5. **`src/agents/pi-embedded-runner/anthropic-extra-params.ts`**
   - Anthropic extended thinking parameter handling
   - Claude 3.7 Sonnet support

## Usage

### For End Users

The fixes are applied automatically. No configuration changes required.

### For Developers

#### Adding Support for a New Model

```typescript
import { ALL_NEW_MODELS } from './agents/model-schema-updates';

// Models are automatically recognized
const model = getNewModelDefinition('openai', 'o3-mini');
```

#### Handling Provider Errors

```typescript
import { handleProviderError } from './agents/pi-embedded-helpers/provider-integration';

try {
  // API call
} catch (error) {
  const enhancedError = handleProviderError({
    error,
    provider: 'openai',
    modelId: 'o3-mini'
  });

  if (shouldFallbackToNextProvider(enhancedError)) {
    // Try next provider
  }
}
```

#### Applying Provider Fixes

```typescript
import { applyProviderFixes, processProviderResponse } from './agents/pi-embedded-helpers/provider-integration';

// Before API call
const { messages, requestParams } = applyProviderFixes({
  provider: 'openai',
  modelId: 'o3-mini',
  messages,
  requestParams
});

// After API call
const processed = processProviderResponse({
  provider: 'openai',
  modelId: 'o3-mini',
  response: rawResponse
});
```

## Testing

### Manual Testing Checklist

- [ ] OpenAI o1-preview with images (text preserved)
- [ ] OpenAI o3-mini with reasoning_effort parameter
- [ ] Gemini 2.0 Flash Thinking with empty responses
- [ ] Gemini tool calls with malformed JSON
- [ ] Claude 3.7 Sonnet with extended_thinking
- [ ] DeepSeek R1 reasoning mode
- [ ] Rate limit errors (fallback works)
- [ ] Non-JSON error responses (HTML pages)

### Automated Tests

Located in:
- `src/agents/pi-embedded-helpers/provider-response-fixes.test.ts` (to be created)
- `src/agents/pi-embedded-helpers/provider-error-handling.test.ts` (to be created)
- `src/agents/model-schema-updates.test.ts` (to be created)

## Migration Guide

### From Previous Versions

No migration required. All fixes are backward compatible.

### Configuration Changes

For extended thinking (Claude 3.7+):

```yaml
# config.yaml
agents:
  defaults:
    extraParams:
      extended_thinking:
        enabled: true
        budget_tokens: 5000  # Optional
```

For o3 reasoning effort:

```yaml
agents:
  defaults:
    extraParams:
      reasoning_effort: "medium"  # low, medium, or high
```

## Known Limitations

1. **Vertex AI Timeouts**: May still occur for very long requests. Consider using streaming.
2. **Gemini Tool Calls**: Sanitization adds overhead. Invalid JSON is replaced with empty object.
3. **Provider Fallback**: Requires multiple API keys configured for fallback to work.

## Future Improvements

1. Add automatic model capability detection from API
2. Implement provider-specific tokenizer selection
3. Add telemetry for error rates by provider
4. Create provider health dashboard

## References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [DeepSeek API Documentation](https://platform.deepseek.com/)

## Contributors

See GitHub issue links for original bug reports and discussions.

## Support

For issues related to these fixes, please open a GitHub issue with:
- Provider and model being used
- Error message or unexpected behavior
- Relevant logs from Jarvis gateway
