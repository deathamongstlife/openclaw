---
title: "Jarvis Architecture Overview"
summary: "High-level architecture and system design of Jarvis"
---

# Jarvis Architecture Overview

This document provides a comprehensive overview of Jarvis's architecture, components, and design patterns.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Jarvis Gateway                        │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Control   │  │   Agent      │  │   Session          │   │
│  │   UI/TUI    │  │   Runtime    │  │   Manager          │   │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬──────────┘   │
│         │                │                     │              │
│         └────────────────┴─────────────────────┘              │
│                          │                                    │
│                 ┌────────▼─────────┐                         │
│                 │  Message Router  │                         │
│                 └────────┬─────────┘                         │
│                          │                                    │
│         ┌────────────────┼────────────────┐                 │
│         │                │                │                 │
│  ┌──────▼───────┐ ┌──────▼──────┐ ┌──────▼───────┐        │
│  │   Channel    │ │   Channel   │ │   Channel    │        │
│  │  Providers   │ │  Providers  │ │  Providers   │        │
│  │  (WhatsApp,  │ │  (Telegram, │ │  (Discord,   │        │
│  │   Signal)    │ │   Slack)    │ │   WebChat)   │        │
│  └──────────────┘ └─────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼────────┐
  │   Model     │  │   Storage   │  │   External   │
  │  Providers  │  │   Layer     │  │   Services   │
  │  (OpenAI,   │  │  (Sessions, │  │  (Webhooks,  │
  │  Anthropic) │  │   Config)   │  │   Cron)      │
  └─────────────┘  └─────────────┘  └──────────────┘
```

## Core Components

### 1. Gateway Server

The Gateway is the central control plane for Jarvis. It manages:

- **Message routing** between channels and agents
- **Session lifecycle** management
- **Authentication and authorization**
- **WebSocket and HTTP APIs**
- **Background services** (cron, health monitoring)

**Key Files:**

- `src/gateway/server.impl.ts` - Main gateway implementation
- `src/gateway/server-startup.ts` - Bootstrap and initialization
- `src/gateway/server-close.ts` - Graceful shutdown

### 2. Agent Runtime

The agent runtime executes AI-powered assistants with access to tools and context.

**Features:**

- **Multi-provider model support** (OpenAI, Anthropic, Gemini, etc.)
- **Tool execution** with sandboxing
- **Context management** and memory
- **Streaming responses**
- **Sub-agent spawning** for parallel tasks

**Key Files:**

- `src/agents/acp-spawn.ts` - Agent Control Protocol spawning
- `src/agents/agent-loop.ts` - Main agent execution loop
- `src/agents/tools/` - Built-in tool implementations

### 3. Channel Providers

Channel providers connect Jarvis to messaging platforms.

**Supported Channels:**

- **WhatsApp** (via web provider)
- **Telegram** (bot API + polling)
- **Discord** (bot)
- **Slack** (bot)
- **Signal** (via signal-cli)
- **iMessage** (macOS only)
- **BlueBubbles**
- **Google Chat**
- **Microsoft Teams** (extension)
- **Matrix** (extension)
- **IRC**
- **WebChat** (built-in UI)

**Architecture:**

- Each channel implements a common interface
- Supports both polling and webhook modes
- Channel-specific message formatting
- Media upload/download handling

**Key Files:**

- `src/telegram/` - Telegram provider
- `src/discord/` - Discord provider
- `src/slack/` - Slack provider
- `src/channels/` - Channel routing logic

### 4. Session Management

Sessions track conversation state and history.

**Features:**

- **Persistent storage** (JSON files or database)
- **Session pruning** and compaction
- **Thread isolation** (for group chats)
- **Session tags** and metadata
- **Export capabilities** (JSON, Markdown, HTML)

**Key Files:**

- `src/gateway/sessions-patch.ts` - Session updates
- `src/concepts/session.md` - Session design docs

### 5. Control UI / Dashboard

Web-based management interface for monitoring and configuration.

**Features:**

- **Real-time metrics** and charts
- **Session browser** with search
- **Config editor** with validation
- **Channel health monitoring**
- **Logs viewer**
- **Agent management**

**Key Files:**

- `ui/src/ui/views/dashboard.ts` - Main dashboard
- `ui/src/ui/views/session-browser.ts` - Session management
- `ui/src/controllers/metrics-controller.ts` - Metrics WebSocket

### 6. Automation System

Background task scheduling and webhook handling.

**Features:**

- **Cron jobs** with isolated sessions
- **Webhooks** for external integrations
- **Heartbeat monitoring**
- **Gmail PubSub** integration
- **Recurring reminders**

**Key Files:**

- `src/cron/service/` - Cron implementation
- `docs/automation/` - Automation docs

## Data Flow

### Message Flow (Inbound)

```
1. Message arrives at channel provider
   ↓
2. Channel provider creates message event
   ↓
3. Message router determines target session
   ↓
4. Session manager loads/creates session
   ↓
5. Agent runtime processes message
   ↓
6. Model provider generates response
   ↓
7. Tools executed if needed
   ↓
8. Response routed back to channel
   ↓
9. Session state persisted
```

### Message Flow (Outbound)

```
1. Agent/CLI sends message
   ↓
2. Message router validates target
   ↓
3. Channel provider formats message
   ↓
4. Message sent via channel API
   ↓
5. Delivery status tracked
   ↓
6. Session updated with sent message
```

## Security Architecture

### Authentication

- **Token-based auth** for HTTP/WebSocket APIs
- **Channel-specific credentials** (bot tokens, API keys)
- **OAuth support** for select providers
- **Secret management** with SecretRefs

### Sandboxing

- **Tool policy system** controls tool access
- **Elevated mode** for privileged operations
- **Approval flows** for sensitive actions
- **Filesystem isolation** for agent workspaces

**See:** `docs/gateway/sandboxing.md`

### Network Security

- **Tailscale integration** for secure remote access
- **Trusted proxy auth** for reverse proxy setups
- **HTTPS/WSS** support
- **CORS configuration**

**See:** `docs/gateway/tailscale.md`, `docs/gateway/trusted-proxy-auth.md`

## Storage Architecture

### Configuration

- **File-based config** (`~/.jarvis/config.json`)
- **Environment variables** for overrides
- **Config validation** and migration
- **Hot reloading** support

### Sessions

- **Default:** JSON files in `~/.jarvis/sessions/`
- **Session pruning** to manage disk usage
- **Compaction** to reduce file size
- **Export/import** capabilities

### Secrets

- **Encrypted credential storage** (`~/.jarvis/credentials/`)
- **1Password integration** (optional)
- **Environment variable fallback**

## Scalability Considerations

### Horizontal Scaling

- **Multiple gateway instances** with shared storage
- **Load balancing** for webhook endpoints
- **Distributed session storage** (future)

### Vertical Scaling

- **Concurrent session handling**
- **Streaming responses** to reduce memory
- **Session compaction** to reduce size
- **Background task queuing**

### Resource Management

- **Configurable concurrency limits**
- **Rate limiting** per channel
- **Token usage tracking**
- **Automatic cleanup** of stale sessions

## Extension Points

### Plugin System

Jarvis supports extensions via:

- **Channel plugins** (new messaging platforms)
- **Tool plugins** (custom agent tools)
- **Model provider plugins** (custom AI backends)
- **Hook system** for custom logic

**See:** `docs/development/plugin-guide.md`

### Hooks

Hooks allow custom code to run at key lifecycle points:

- `onMessageReceived`
- `onMessageSent`
- `onSessionCreated`
- `onAgentStart`
- `onAgentComplete`

**See:** `docs/automation/hooks.md`

## Development Architecture

### Build System

- **pnpm** for package management
- **TypeScript** with strict mode
- **Oxlint** for linting
- **Oxfmt** for formatting
- **Vitest** for testing

### Code Organization

```
jarvis/
├── src/                    # Core TypeScript source
│   ├── gateway/           # Gateway server
│   ├── agents/            # Agent runtime
│   ├── channels/          # Channel providers
│   ├── cli/               # CLI commands
│   ├── config/            # Configuration
│   ├── cron/              # Automation
│   └── infra/             # Infrastructure utilities
├── ui/                    # Control UI (Lit components)
├── apps/                  # Native apps (iOS, macOS, Android)
├── extensions/            # Channel and tool extensions
├── docs/                  # Documentation
└── scripts/               # Build and utility scripts
```

### Testing Strategy

- **Unit tests** for core logic
- **Integration tests** for channels
- **E2E tests** for critical flows
- **Coverage targets** (70%+ for core)

**See:** `docs/testing.md`

## Deployment Architectures

### Single-User (Typical)

```
[User Device]
    ↓
[Jarvis Gateway]
    ↓
[AI Provider APIs]
```

### Multi-Channel Remote

```
[Channels] → [Reverse Proxy] → [Jarvis Gateway] → [AI Providers]
              (with auth)       (on home server)
```

### Distributed Team

```
[Team Members]
      ↓
[Shared Gateway]
      ↓
[AI Providers]
```

## Performance Characteristics

### Latency

- **Message routing:** <10ms
- **Session load:** <50ms
- **Agent response:** 1-5s (model-dependent)
- **Tool execution:** Variable (1-10s typical)

### Throughput

- **Messages/sec:** 10-100 (single gateway)
- **Concurrent sessions:** 100+
- **WebSocket connections:** 1000+

### Resource Usage

- **Memory:** 200-500MB baseline
- **CPU:** Low when idle, spikes during agent execution
- **Disk:** Depends on session history (1-10GB typical)

## Future Architecture Improvements

### Planned Enhancements

1. **Database backend** for sessions (PostgreSQL, SQLite)
2. **Message queue** for reliable delivery (Redis, RabbitMQ)
3. **Distributed tracing** (OpenTelemetry)
4. **Advanced observability** (Prometheus metrics)
5. **Multi-tenant support** for teams
6. **Real-time collaboration** features

### Research Areas

- **Federated gateway architecture**
- **Peer-to-peer channel bridging**
- **On-device model inference**
- **End-to-end encryption** for sessions

## Related Documentation

- [Configuration Reference](../gateway/configuration-reference.md)
- [Session Management](../concepts/session.md)
- [Agent Loop Design](../concepts/agent-loop.md)
- [Multi-Agent Architecture](../concepts/multi-agent.md)
- [Channel Routing](../channels/channel-routing.md)
- [Plugin Development Guide](../development/plugin-guide.md)

---

**Last Updated:** March 2026

For questions or clarifications, see the [Discord community](https://discord.gg/clawd) or [GitHub discussions](https://github.com/jarvis/jarvis/discussions).
