# OpenClaw Coding Standards & Conventions

**Purpose**: This document defines coding standards, patterns, and best practices for OpenClaw development.
**Audience**: AI coding assistants (Claude), contributors, and maintainers.

---

## General Principles

1. **TypeScript First**: All new code must be TypeScript with strict mode enabled
2. **Modular Design**: Keep functions small (<100 lines), files focused (<500 lines)
3. **Test Coverage**: Write tests for new features (target: 80%+ coverage)
4. **Type Safety**: Avoid `any`, prefer explicit types or generics
5. **Async/Await**: Use async/await over raw promises
6. **Error Handling**: Use custom error types from `src/infra/errors.ts`

---

## Code Style & Formatting

### TypeScript Conventions

```typescript
// ✅ GOOD: Explicit return types, const for immutable, descriptive names
export async function loadSessionMessages(
  sessionKey: string,
  limit?: number
): Promise<Message[]> {
  const sessionPath = resolveSessionPath(sessionKey);
  const messages = await readJsonFile<Message[]>(sessionPath);
  return limit ? messages.slice(-limit) : messages;
}

// ❌ BAD: Missing return type, var keyword, vague names
export async function load(k: string, l?: number) {
  var p = getPath(k);
  var m = await read(p);
  return l ? m.slice(-l) : m;
}
```

### Import Organization

```typescript
// 1. Node built-ins
import path from "node:path";
import fs from "node:fs/promises";

// 2. External dependencies
import { z } from "zod";
import type { Express } from "express";

// 3. Internal imports (relative paths)
import { resolveSessionPath } from "../sessions/utils.js";
import type { OpenClawConfig } from "../config/types.js";
import { logger } from "../infra/logger.js";

// 4. Type-only imports separated when possible
import type { Message, Session } from "../types.js";
```

### File Extensions
- Always use `.js` extension in import statements (TypeScript resolves correctly)
- Source files: `.ts`, `.tsx` (for Lit components with JSX)
- Test files: `.test.ts`
- Type definitions: `.d.ts` (when needed)

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `session-manager.ts` |
| Classes | PascalCase | `ChannelManager` |
| Interfaces | PascalCase | `GatewayConfig` |
| Types | PascalCase | `SessionKey` |
| Functions | camelCase | `loadSession` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PORT` |
| Private methods | _camelCase | `_internal` |
| Variables | camelCase | `sessionKey` |

---

## Architecture Patterns

### Plugin Pattern

All channel implementations follow the plugin pattern:

```typescript
// extensions/[channel]/index.ts
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

export default {
  id: "my-channel",
  name: "My Channel",
  description: "Integration for My Channel",
  configSchema: myChannelConfigSchema(),

  register(api: OpenClawPluginApi) {
    // Set up runtime context
    setChannelRuntime(api.runtime);

    // Register channel plugin
    api.registerChannel({ plugin: myChannelPlugin });

    // Register hooks if needed
    registerChannelHooks(api);
  }
};
```

### Service Pattern

For shared services:

```typescript
// src/services/my-service.ts
export class MyService {
  private readonly config: MyServiceConfig;
  private readonly logger: Logger;

  constructor(deps: MyServiceDeps) {
    this.config = deps.config;
    this.logger = deps.logger;
  }

  async initialize(): Promise<void> {
    // Setup code
  }

  async shutdown(): Promise<void> {
    // Cleanup code
  }

  // Public API methods
  async doSomething(input: string): Promise<Result> {
    // Implementation
  }
}
```

### Error Handling Pattern

```typescript
import { OpenClawError, ErrorCode } from "../infra/errors.js";

// Custom error types
export class SessionNotFoundError extends OpenClawError {
  constructor(sessionKey: string) {
    super({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: `Session not found: ${sessionKey}`,
      context: { sessionKey }
    });
  }
}

// Usage in functions
export async function loadSession(key: string): Promise<Session> {
  try {
    const data = await fs.readFile(getSessionPath(key), "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new SessionNotFoundError(key);
    }
    throw new OpenClawError({
      code: ErrorCode.SESSION_LOAD_FAILED,
      message: "Failed to load session",
      context: { key },
      cause: error
    });
  }
}
```

### Configuration Pattern

```typescript
// src/config/my-feature.ts
import { z } from "zod";

// Schema definition
export const myFeatureConfigSchema = z.object({
  enabled: z.boolean().default(true),
  timeout: z.number().min(1000).default(5000),
  retries: z.number().min(0).max(10).default(3)
});

export type MyFeatureConfig = z.infer<typeof myFeatureConfigSchema>;

// Config loading with validation
export function loadMyFeatureConfig(raw: unknown): MyFeatureConfig {
  const result = myFeatureConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new ConfigValidationError("my-feature", result.error);
  }
  return result.data;
}
```

---

## UI Development (Lit Components)

### Component Structure

```typescript
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("my-component")
export class MyComponent extends LitElement {
  // Public properties (attributes)
  @property({ type: String })
  title = "";

  // Internal state
  @state()
  private _loading = false;

  // Styles (scoped to component)
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .loading {
      opacity: 0.5;
    }
  `;

  // Lifecycle
  connectedCallback() {
    super.connectedCallback();
    this._initialize();
  }

  private async _initialize() {
    this._loading = true;
    // Setup code
    this._loading = false;
  }

  // Render
  render() {
    return html`
      <div class=${this._loading ? "loading" : ""}>
        <h2>${this.title}</h2>
        <button @click=${this._handleClick}>
          Click me
        </button>
      </div>
    `;
  }

  private _handleClick() {
    this.dispatchEvent(new CustomEvent("my-event", {
      detail: { timestamp: Date.now() },
      bubbles: true,
      composed: true
    }));
  }
}
```

### UI File Organization

```
ui/src/
├── ui/
│   ├── app.ts              # Main app component
│   ├── views/              # Page-level views
│   │   ├── dashboard.ts
│   │   ├── sessions.ts
│   │   └── settings.ts
│   ├── components/         # Reusable components
│   │   ├── session-list.ts
│   │   ├── channel-status.ts
│   │   └── metric-card.ts
│   └── controllers/        # Reactive controllers
│       ├── gateway-controller.ts
│       └── theme-controller.ts
└── styles/
    ├── global.css          # Global styles
    └── theme.css           # Theme variables
```

---

## API Endpoint Patterns

### REST API Convention

```typescript
// src/gateway/server-http.ts (adding new endpoint)

// ✅ GOOD: Clear path, versioned, proper error handling
app.get("/api/v1/sessions/:sessionKey", async (req, res) => {
  try {
    const { sessionKey } = req.params;

    // Validate input
    if (!isValidSessionKey(sessionKey)) {
      res.status(400).json({
        error: "INVALID_SESSION_KEY",
        message: "Session key format is invalid"
      });
      return;
    }

    // Fetch data
    const session = await sessionManager.getSession(sessionKey);

    if (!session) {
      res.status(404).json({
        error: "SESSION_NOT_FOUND",
        message: `Session not found: ${sessionKey}`
      });
      return;
    }

    // Return successful response
    res.status(200).json({ session });
  } catch (error) {
    logger.error("Failed to get session", { error, sessionKey: req.params.sessionKey });
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to retrieve session"
    });
  }
});

// ❌ BAD: No error handling, unclear path, no validation
app.get("/session", async (req, res) => {
  const s = await get(req.query.key);
  res.json(s);
});
```

### API Response Format

```typescript
// Success response
{
  "data": { /* response payload */ },
  "metadata": {
    "timestamp": "2026-03-11T16:00:00Z",
    "requestId": "req-123"
  }
}

// Error response
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found: main:discord:user123",
    "details": {
      "sessionKey": "main:discord:user123"
    }
  },
  "metadata": {
    "timestamp": "2026-03-11T16:00:00Z",
    "requestId": "req-123"
  }
}
```

---

## Testing Patterns

### Unit Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SessionManager } from "./session-manager.js";

describe("SessionManager", () => {
  let manager: SessionManager;
  let testConfig: SessionConfig;

  beforeEach(() => {
    testConfig = {
      baseDir: "/tmp/test-sessions",
      maxHistory: 100
    };
    manager = new SessionManager(testConfig);
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  describe("getSession", () => {
    it("should return existing session", async () => {
      // Arrange
      const sessionKey = "test:discord:user123";
      await manager.createSession(sessionKey);

      // Act
      const session = await manager.getSession(sessionKey);

      // Assert
      expect(session).toBeDefined();
      expect(session.key).toBe(sessionKey);
    });

    it("should throw when session not found", async () => {
      // Arrange
      const sessionKey = "nonexistent";

      // Act & Assert
      await expect(
        manager.getSession(sessionKey)
      ).rejects.toThrow(SessionNotFoundError);
    });
  });
});
```

### Integration Test Pattern

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestGateway, stopTestGateway } from "./test-utils.js";

describe("Gateway Integration", () => {
  let gateway: TestGateway;

  beforeAll(async () => {
    gateway = await startTestGateway({
      port: 18790,
      channels: ["discord"]
    });
  });

  afterAll(async () => {
    await stopTestGateway(gateway);
  });

  it("should handle message flow end-to-end", async () => {
    // Send message through gateway
    const response = await gateway.sendMessage({
      channel: "discord",
      user: "test-user",
      text: "Hello"
    });

    // Verify response
    expect(response.status).toBe("delivered");
    expect(response.messageId).toBeDefined();
  });
});
```

---

## CLI Command Patterns

### Command Implementation

```typescript
// src/commands/my-command.ts
import { Command } from "commander";
import { logger } from "../infra/logger.js";

export function registerMyCommand(program: Command): void {
  program
    .command("my-command")
    .description("Description of what this command does")
    .option("-v, --verbose", "Enable verbose output")
    .option("-o, --output <file>", "Output file path")
    .argument("<input>", "Input value")
    .action(async (input, options) => {
      try {
        if (options.verbose) {
          logger.setLevel("debug");
        }

        // Validate inputs
        if (!input) {
          logger.error("Input is required");
          process.exit(1);
        }

        // Execute command logic
        const result = await executeMyCommand(input, options);

        // Handle output
        if (options.output) {
          await writeResultToFile(result, options.output);
        } else {
          console.log(result);
        }
      } catch (error) {
        logger.error("Command failed", { error });
        process.exit(1);
      }
    });
}

async function executeMyCommand(
  input: string,
  options: { verbose?: boolean }
): Promise<string> {
  // Implementation
  return "result";
}
```

---

## Logging Standards

### Logger Usage

```typescript
import { logger } from "../infra/logger.js";

// ✅ GOOD: Structured logging with context
logger.info("Session created", {
  sessionKey,
  channelId,
  userId,
  timestamp: Date.now()
});

logger.error("Failed to send message", {
  error,
  channelId,
  messageId,
  retryCount
});

// ❌ BAD: Unstructured, no context
console.log("Session created");
console.error("Error:", error);
```

### Log Levels

- **debug**: Detailed diagnostic information (verbose mode only)
- **info**: General informational messages (normal operations)
- **warn**: Warning messages (recoverable issues)
- **error**: Error messages (failures that need attention)
- **fatal**: Critical errors (system-level failures)

---

## Performance Guidelines

### Async Operations

```typescript
// ✅ GOOD: Parallel execution when possible
const [sessions, channels, config] = await Promise.all([
  loadSessions(),
  loadChannels(),
  loadConfig()
]);

// ❌ BAD: Sequential when not necessary
const sessions = await loadSessions();
const channels = await loadChannels();
const config = await loadConfig();
```

### Caching Pattern

```typescript
export class DataCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;

  constructor(ttlMs: number = 60000) {
    this.ttl = ttlMs;
  }

  async get(key: string, loader: () => Promise<T>): Promise<T> {
    const entry = this.cache.get(key);

    // Check cache validity
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.value;
    }

    // Load and cache
    const value = await loader();
    this.cache.set(key, { value, timestamp: Date.now() });
    return value;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

## Security Best Practices

### Credential Handling

```typescript
// ✅ GOOD: Never log credentials
logger.info("Discord bot authenticated", {
  botId: config.botId,
  guildCount: guilds.length
  // ❌ DON'T: token: config.token
});

// ✅ GOOD: Mask sensitive data in API responses
function sanitizeConfig(config: OpenClawConfig): Sanitized<OpenClawConfig> {
  return {
    ...config,
    channels: {
      discord: {
        ...config.channels.discord,
        token: "***MASKED***"
      }
    }
  };
}
```

### Input Validation

```typescript
import { z } from "zod";

// ✅ GOOD: Validate all external inputs
const sessionKeySchema = z.string()
  .regex(/^[a-z0-9]+:[a-z0-9]+:[a-z0-9]+$/)
  .max(256);

export function validateSessionKey(input: unknown): string {
  const result = sessionKeySchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError("Invalid session key format");
  }
  return result.data;
}

// ❌ BAD: No validation
export function useSessionKey(input: string): void {
  // Directly using unvalidated input
  const path = `/sessions/${input}`;
}
```

---

## Documentation Standards

### Code Comments

```typescript
/**
 * Loads a session from persistent storage.
 *
 * @param sessionKey - Unique session identifier (format: agent:channel:user)
 * @param options - Optional loading parameters
 * @returns Promise resolving to the loaded session
 * @throws SessionNotFoundError if session doesn't exist
 * @throws SessionLoadError if loading fails
 *
 * @example
 * ```typescript
 * const session = await loadSession("main:discord:user123");
 * console.log(session.messages.length);
 * ```
 */
export async function loadSession(
  sessionKey: string,
  options?: LoadSessionOptions
): Promise<Session> {
  // Implementation
}

// Inline comments for complex logic only
function complexAlgorithm(data: Data): Result {
  // Step 1: Normalize input data to handle edge cases
  const normalized = normalizeData(data);

  // Step 2: Apply transformation using efficient algorithm
  // NOTE: This uses O(n log n) time complexity vs naive O(n²)
  const transformed = transform(normalized);

  return transformed;
}
```

---

## File Structure Conventions

### Component File Template

```typescript
// 1. Imports (organized as described above)
import type { Dependencies } from "../types.js";

// 2. Type definitions
export interface MyComponentConfig {
  enabled: boolean;
  timeout: number;
}

export interface MyComponentOptions {
  verbose?: boolean;
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000;
const MAX_RETRIES = 3;

// 4. Main class/function
export class MyComponent {
  constructor(config: MyComponentConfig) {
    // Constructor
  }

  // Public methods
  async initialize(): Promise<void> {
    // Implementation
  }

  // Private methods
  private _internalMethod(): void {
    // Implementation
  }
}

// 5. Helper functions (if not extracted to utils)
function helperFunction(input: string): string {
  return input.trim();
}

// 6. Exports (named exports preferred over default)
export { helperFunction };
```

---

## Migration Guide for New Features

### Checklist for Adding New Features

1. **Design**
   - [ ] Review existing patterns in similar features
   - [ ] Design data models and types
   - [ ] Consider backwards compatibility
   - [ ] Document API surface

2. **Implementation**
   - [ ] Create feature branch from `main`
   - [ ] Implement core logic with tests
   - [ ] Add configuration schema
   - [ ] Handle errors gracefully
   - [ ] Add logging for key operations

3. **Testing**
   - [ ] Unit tests for core logic (>80% coverage)
   - [ ] Integration tests for E2E flows
   - [ ] Manual testing in dev environment

4. **Documentation**
   - [ ] Add/update JSDoc comments
   - [ ] Update relevant `docs/**/*.md` files
   - [ ] Add examples and usage guides
   - [ ] Update CHANGELOG.md

5. **Code Review**
   - [ ] Run `pnpm check` (format, lint, typecheck)
   - [ ] Run `pnpm test` (all tests pass)
   - [ ] Self-review code changes
   - [ ] Submit PR with clear description

---

## Common Pitfalls to Avoid

### ❌ Don't

- Use `any` type without strong justification
- Ignore TypeScript errors (fix them!)
- Use `console.log` for production logging
- Hard-code configuration values
- Forget error handling in async functions
- Leave commented-out code
- Use `var` keyword (use `const` or `let`)
- Modify files larger than 500 LOC (refactor first)

### ✅ Do

- Use strict TypeScript with explicit types
- Use structured logging with context
- Extract configuration to schema
- Handle errors with custom error types
- Clean up commented code before commit
- Use `const` by default, `let` when needed
- Keep files focused and modular

---

## Tools & Commands

### Development Workflow

```bash
# Install dependencies
pnpm install

# Type-checking
pnpm tsgo  # or: tsc --noEmit

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:check

# Testing
pnpm test           # All tests
pnpm test:fast      # Unit tests only
pnpm test:watch     # Watch mode

# Build
pnpm build

# Run in development
pnpm dev
pnpm gateway:watch  # Auto-reload gateway
```

### Pre-commit Checks

All code must pass:
1. TypeScript compilation
2. Linting (oxlint)
3. Formatting (oxfmt)
4. Unit tests

Run `pnpm check` before committing.

---

## Version & Changelog

- Update CHANGELOG.md for user-facing changes
- Follow semantic versioning (vYYYY.M.D format)
- Tag releases properly in git

---

**Last Updated**: 2026-03-11
**Maintained By**: OpenClaw Team
