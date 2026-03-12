# OpenClaw Dashboard Integration Guide

This guide walks you through integrating the new dashboard components into the OpenClaw application.

## Table of Contents
1. [Installation](#installation)
2. [Frontend Integration](#frontend-integration)
3. [Backend API Implementation](#backend-api-implementation)
4. [Testing](#testing)
5. [Deployment](#deployment)

---

## Installation

### Step 1: Install New Dependencies

```bash
cd ui
npm install chart.js date-fns
# or if using pnpm:
pnpm install
```

### Step 2: Build UI Assets

```bash
npm run build
# or
pnpm build
```

---

## Frontend Integration

### Step 1: Update Main App Component

Edit `ui/src/ui/app.ts`:

```typescript
// Add new imports at the top
import { renderDashboard } from "./views/dashboard.js";
import { renderSessionBrowser } from "./views/session-browser.js";
import { renderConfigEditor } from "./views/config-editor.js";
import { renderChannelsHealth } from "./views/channels-health.js";

// Update the Tab type (around line 62)
export type Tab =
  | "dashboard"
  | "chat"
  | "sessions"
  | "session-browser"
  | "channels"
  | "channels-health"
  | "config"
  | "config-editor"
  | "settings"
  | "debug"
  | "logs"
  | "usage"
  | "agents"
  | "skills"
  | "cron"
  | "nodes"
  | "presence"
  | "instances"
  | "overview";
```

### Step 2: Update Navigation

Edit `ui/src/ui/navigation.ts`:

```typescript
export const TABS: Array<{ key: Tab; label: string }> = [
  { key: "dashboard", label: "Dashboard" }, // Add as first tab
  { key: "chat", label: "Chat" },
  { key: "session-browser", label: "Sessions" },
  { key: "channels-health", label: "Channels" },
  { key: "config-editor", label: "Config" },
  // ... rest of existing tabs
];
```

### Step 3: Update Render Function

Edit `ui/src/ui/app-render.ts`:

```typescript
// Add imports at top
import { renderDashboard } from "./views/dashboard.js";
import { renderSessionBrowser } from "./views/session-browser.js";
import { renderConfigEditor } from "./views/config-editor.js";
import { renderChannelsHealth } from "./views/channels-health.js";

// In the main render function, add these cases to the tab switch:
function renderMainContent(state: AppViewState) {
  switch (state.tab) {
    case "dashboard":
      return renderDashboard(state);

    case "session-browser":
      return renderSessionBrowser(state);

    case "config-editor":
      return renderConfigEditor(state);

    case "channels-health":
      return renderChannelsHealth(state);

    // ... existing cases
  }
}
```

### Step 4: Add CSS Variables (Optional)

Add these to `ui/src/styles.css` if needed:

```css
:root {
  --color-primary: #3b82f6;
  --color-primary-light: #dbeafe;
  --color-surface: #ffffff;
  --color-surface-hover: #f9fafb;
  --color-border: #e5e7eb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
}

[data-theme="dark"] {
  --color-surface: #1f2937;
  --color-surface-hover: #374151;
  --color-border: #374151;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #9ca3af;
}
```

---

## Backend API Implementation

### Step 1: Create Metrics Collector Service

Create `src/gateway/metrics-collector.ts`:

```typescript
export type MetricsSnapshot = {
  timestamp: number;
  messagesPerMinute: number;
  avgResponseTime: number;
  activeSessionsCount: number;
  errorRate: number;
  channelActivity: Record<string, number>;
  modelUsage: Record<string, { tokens: number; requests: number }>;
};

export class MetricsCollector {
  private messageTimestamps: number[] = [];
  private responseTimes: number[] = [];
  private sessionKeys = new Set<string>();
  private errorCount = 0;
  private totalMessages = 0;
  private channelCounts = new Map<string, number>();
  private modelStats = new Map<string, { tokens: number; requests: number }>();
  private subscribers = new Set<(metrics: MetricsSnapshot) => void>();

  recordMessage(channel: string, sessionKey: string): void {
    const now = Date.now();
    this.messageTimestamps.push(now);
    this.sessionKeys.add(sessionKey);
    this.totalMessages++;

    const current = this.channelCounts.get(channel) || 0;
    this.channelCounts.set(channel, current + 1);

    // Keep only last minute of timestamps
    const oneMinuteAgo = now - 60000;
    this.messageTimestamps = this.messageTimestamps.filter(t => t > oneMinuteAgo);

    this.broadcastMetrics();
  }

  recordResponseTime(ms: number): void {
    this.responseTimes.push(ms);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    this.broadcastMetrics();
  }

  recordError(): void {
    this.errorCount++;
    this.broadcastMetrics();
  }

  recordModelUsage(model: string, tokens: number): void {
    const current = this.modelStats.get(model) || { tokens: 0, requests: 0 };
    this.modelStats.set(model, {
      tokens: current.tokens + tokens,
      requests: current.requests + 1,
    });
    this.broadcastMetrics();
  }

  getSnapshot(): MetricsSnapshot {
    const avgResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0;

    const errorRate =
      this.totalMessages > 0
        ? (this.errorCount / this.totalMessages) * 100
        : 0;

    return {
      timestamp: Date.now(),
      messagesPerMinute: this.messageTimestamps.length,
      avgResponseTime,
      activeSessionsCount: this.sessionKeys.size,
      errorRate,
      channelActivity: Object.fromEntries(this.channelCounts),
      modelUsage: Object.fromEntries(this.modelStats),
    };
  }

  subscribe(callback: (metrics: MetricsSnapshot) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private broadcastMetrics(): void {
    const snapshot = this.getSnapshot();
    this.subscribers.forEach(callback => callback(snapshot));
  }
}
```

### Step 2: Add WebSocket Metrics Stream Handler

Create `src/gateway/server/metrics-stream.ts`:

```typescript
import type { WebSocket } from "ws";
import type { MetricsCollector } from "../metrics-collector.js";

export function setupMetricsStream(ws: WebSocket, collector: MetricsCollector) {
  ws.send(JSON.stringify({ type: "connected" }));

  // Send initial snapshot
  const snapshot = collector.getSnapshot();
  ws.send(JSON.stringify({ type: "metrics", data: snapshot }));

  // Subscribe to updates
  const unsubscribe = collector.subscribe((metrics) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify({ type: "metrics", data: metrics }));
    }
  });

  ws.on("close", () => {
    unsubscribe();
  });

  ws.on("error", (error) => {
    console.error("Metrics WebSocket error:", error);
    unsubscribe();
  });
}
```

### Step 3: Add REST API Endpoints

In your HTTP server setup (e.g., `src/gateway/control-ui.ts` or create new file):

```typescript
import type { IncomingMessage, ServerResponse } from "node:http";
import type { MetricsCollector } from "./metrics-collector.js";
import type { SessionStore } from "./session-store.js";
import type { ConfigManager } from "../config/manager.js";

export function setupDashboardEndpoints(
  metricsCollector: MetricsCollector,
  sessionStore: SessionStore,
  configManager: ConfigManager
) {
  return {
    // GET /api/v1/metrics/realtime
    async handleMetricsRealtime(req: IncomingMessage, res: ServerResponse) {
      const snapshot = metricsCollector.getSnapshot();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, metrics: snapshot }));
    },

    // GET /api/v1/sessions
    async handleSessionsList(req: IncomingMessage, res: ServerResponse) {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const query = url.searchParams.get("q") || "";
      const channel = url.searchParams.get("channel");
      const start = url.searchParams.get("start");
      const end = url.searchParams.get("end");

      const sessions = await sessionStore.search({
        query,
        channel: channel || undefined,
        startDate: start ? new Date(start) : undefined,
        endDate: end ? new Date(end) : undefined,
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, sessions }));
    },

    // GET /api/v1/sessions/:key
    async handleSessionDetail(req: IncomingMessage, res: ServerResponse, key: string) {
      const session = await sessionStore.getSession(key);

      if (!session) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Session not found" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, ...session }));
    },

    // POST /api/v1/sessions/:key/export
    async handleSessionExport(req: IncomingMessage, res: ServerResponse, key: string) {
      const body = await readBody(req);
      const { format = "json" } = JSON.parse(body);

      const session = await sessionStore.getSession(key);
      if (!session) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Session not found" }));
        return;
      }

      let content: string;
      let contentType: string;
      let filename: string;

      switch (format) {
        case "json":
          content = JSON.stringify(session, null, 2);
          contentType = "application/json";
          filename = `session-${key}.json`;
          break;

        case "markdown":
          content = exportToMarkdown(session);
          contentType = "text/markdown";
          filename = `session-${key}.md`;
          break;

        case "html":
          content = exportToHtml(session);
          contentType = "text/html";
          filename = `session-${key}.html`;
          break;

        default:
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Invalid format" }));
          return;
      }

      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
      res.end(content);
    },

    // GET /api/v1/config
    async handleConfigGet(req: IncomingMessage, res: ServerResponse) {
      const config = configManager.getConfig();
      const sanitized = sanitizeConfig(config);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, config: sanitized }));
    },

    // PUT /api/v1/config
    async handleConfigPut(req: IncomingMessage, res: ServerResponse) {
      const body = await readBody(req);
      const { config } = JSON.parse(body);

      const validation = validateConfig(config);
      if (!validation.valid) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: false,
          error: "Invalid configuration",
          errors: validation.errors
        }));
        return;
      }

      await configManager.updateConfig(config);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    },

    // GET /api/v1/channels/health
    async handleChannelsHealth(req: IncomingMessage, res: ServerResponse) {
      // Implement based on your channel management system
      const channels = await getChannelsHealth();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, channels }));
    },

    // POST /api/v1/channels/:name/action
    async handleChannelAction(req: IncomingMessage, res: ServerResponse, name: string) {
      const body = await readBody(req);
      const { action } = JSON.parse(body);

      await performChannelAction(name, action);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    },
  };
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function exportToMarkdown(session: any): string {
  let md = `# Session: ${session.key}\\n\\n`;
  md += `**Channel**: ${session.channel}\\n`;
  md += `**User**: ${session.user}\\n\\n`;
  md += `---\\n\\n`;

  for (const msg of session.messages) {
    md += `### ${msg.role === "user" ? "User" : "Assistant"}\\n\\n`;
    md += `${msg.content}\\n\\n`;
    md += `*${new Date(msg.timestamp).toLocaleString()}*\\n\\n`;
  }

  return md;
}

function exportToHtml(session: any): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Session ${session.key}</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .message { padding: 1rem; margin-bottom: 1rem; border-left: 3px solid #ddd; }
    .user { background: #f0f9ff; border-left-color: #3b82f6; }
    .assistant { background: #f9fafb; border-left-color: #10b981; }
    .timestamp { color: #666; font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>Session: ${session.key}</h1>
  <p><strong>Channel:</strong> ${session.channel}</p>
  <p><strong>User:</strong> ${session.user}</p>
  <hr>`;

  for (const msg of session.messages) {
    html += `
  <div class="message ${msg.role}">
    <h3>${msg.role === "user" ? "User" : "Assistant"}</h3>
    <p>${msg.content.replace(/\\n/g, "<br>")}</p>
    <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
  </div>`;
  }

  html += `
</body>
</html>`;

  return html;
}

function sanitizeConfig(config: any): any {
  // Remove sensitive fields
  const sanitized = JSON.parse(JSON.stringify(config));

  // Redact secrets
  if (sanitized.apiKeys) {
    for (const key in sanitized.apiKeys) {
      sanitized.apiKeys[key] = "***REDACTED***";
    }
  }

  return sanitized;
}

function validateConfig(config: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Add your validation logic
  // Example:
  // if (!config.gateway?.port) {
  //   errors["gateway.port"] = "Port is required";
  // }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

### Step 4: Integrate Into Gateway Bootstrap

Edit `src/gateway/boot.ts` (or wherever your gateway initializes):

```typescript
import { MetricsCollector } from "./metrics-collector.js";
import { setupMetricsStream } from "./server/metrics-stream.js";
import { setupDashboardEndpoints } from "./server/dashboard-endpoints.js";

// In your gateway initialization:
const metricsCollector = new MetricsCollector();

// Hook into message events
gateway.on("message", (event) => {
  metricsCollector.recordMessage(event.channel, event.sessionKey);
  // Record response time when response completes
  const startTime = Date.now();
  event.on("complete", () => {
    metricsCollector.recordResponseTime(Date.now() - startTime);
  });
  event.on("error", () => {
    metricsCollector.recordError();
  });
});

// Hook into model usage events
gateway.on("model-usage", (event) => {
  metricsCollector.recordModelUsage(event.model, event.tokens);
});

// Setup WebSocket handler
httpServer.on("upgrade", (req, socket, head) => {
  if (req.url === "/api/v1/metrics/stream") {
    wsServer.handleUpgrade(req, socket, head, (ws) => {
      setupMetricsStream(ws, metricsCollector);
    });
  }
});

// Setup REST endpoints
const dashboardEndpoints = setupDashboardEndpoints(
  metricsCollector,
  sessionStore,
  configManager
);
```

---

## Testing

### Step 1: Test UI Components

```bash
cd ui
npm test
```

### Step 2: Test WebSocket Connection

Open browser console and test:

```javascript
const ws = new WebSocket("ws://localhost:8080/api/v1/metrics/stream");
ws.onmessage = (event) => console.log("Metrics:", JSON.parse(event.data));
```

### Step 3: Test API Endpoints

```bash
# Test metrics endpoint
curl http://localhost:8080/api/v1/metrics/realtime

# Test sessions list
curl http://localhost:8080/api/v1/sessions

# Test config get
curl http://localhost:8080/api/v1/config
```

---

## Deployment

### Step 1: Build Production Assets

```bash
cd ui
npm run build
```

### Step 2: Deploy Gateway Updates

```bash
# Build TypeScript
npm run build

# Restart gateway
npm run gateway:restart
```

### Step 3: Verify Deployment

1. Navigate to `http://your-gateway:8080/`
2. Click on "Dashboard" tab
3. Verify metrics are flowing
4. Test all new features

---

## Troubleshooting

### Issue: WebSocket Connection Fails

**Solution**: Check that WebSocket upgrade is properly configured in your HTTP server.

### Issue: Charts Not Rendering

**Solution**: Ensure Chart.js is loaded and canvas elements have proper dimensions.

### Issue: No Metrics Data

**Solution**: Verify MetricsCollector is properly instantiated and events are being recorded.

### Issue: Config Changes Not Saving

**Solution**: Check backend validation logic and file permissions.

---

## Additional Resources

- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Lit Components Guide](https://lit.dev/docs/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## Support

For issues or questions:
1. Check the implementation summary (`DASHBOARD_IMPLEMENTATION_SUMMARY.md`)
2. Review component source code
3. Check browser console for errors
4. Review gateway logs for backend issues

---

**Happy coding!** 🚀
