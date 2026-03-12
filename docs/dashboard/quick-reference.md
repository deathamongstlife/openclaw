# OpenClaw Dashboard Quick Reference

## 📁 File Structure

```
openclaw/
├── ui/
│   ├── package.json                    ✅ UPDATED (added chart.js, date-fns)
│   └── src/
│       ├── components/
│       │   ├── metric-card.ts          ✅ NEW (metric display cards)
│       │   ├── session-list-item.ts    ✅ NEW (session list items)
│       │   └── channel-health-card.ts  ✅ NEW (channel health cards)
│       ├── controllers/
│       │   └── metrics-controller.ts   ✅ NEW (WebSocket metrics manager)
│       └── ui/
│           └── views/
│               ├── dashboard.ts        ✅ NEW (analytics dashboard)
│               ├── session-browser.ts  ✅ NEW (session explorer)
│               ├── config-editor.ts    ✅ NEW (visual config editor)
│               └── channels-health.ts  ✅ NEW (channel health monitor)
└── src/
    └── gateway/
        ├── metrics-collector.ts        ⏳ TODO (metrics collection service)
        └── server/
            ├── metrics-stream.ts       ⏳ TODO (WebSocket handler)
            └── dashboard-endpoints.ts  ⏳ TODO (REST API endpoints)
```

---

## 🎨 UI Components

### Metric Card
```typescript
<metric-card
  label="Messages/Minute"
  value="42"
  trend="+12% from last hour"
  trendDirection="up"
  icon="📨"
  variant="success"
></metric-card>
```

### Session List Item
```typescript
<session-list-item
  .session=${sessionData}
  ?selected=${isSelected}
  @session-select=${handleSelect}
></session-list-item>
```

### Channel Health Card
```typescript
<channel-health-card
  .channel=${channelData}
  @channel-action=${handleAction}
></channel-health-card>
```

---

## 🔌 API Endpoints

### Metrics
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/metrics/realtime` | Current metrics snapshot |
| `WS` | `/api/v1/metrics/stream` | Real-time metrics stream |

### Sessions
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/sessions` | List/search sessions |
| `GET` | `/api/v1/sessions/:key` | Session details |
| `POST` | `/api/v1/sessions/:key/export` | Export session |

### Configuration
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/config` | Get config (sanitized) |
| `PUT` | `/api/v1/config` | Update config |

### Channels
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/channels/health` | Channel health status |
| `POST` | `/api/v1/channels/:name/action` | Perform channel action |

---

## 📊 Metrics Data Structure

```typescript
type MetricsSnapshot = {
  timestamp: number;
  messagesPerMinute: number;
  avgResponseTime: number;      // milliseconds
  activeSessionsCount: number;
  errorRate: number;             // percentage (0-100)
  channelActivity: {             // messages per channel
    telegram: number;
    discord: number;
    // ...
  };
  modelUsage: {                  // token usage by model
    "claude-sonnet-4.5": {
      tokens: number;
      requests: number;
    };
    // ...
  };
};
```

---

## 🎯 Quick Integration Checklist

### Frontend (5 steps)
- [ ] Install dependencies: `npm install chart.js date-fns`
- [ ] Import views in `app.ts`
- [ ] Add navigation tabs
- [ ] Update render switch statement
- [ ] Build UI: `npm run build`

### Backend (4 steps)
- [ ] Create `MetricsCollector` service
- [ ] Implement WebSocket handler
- [ ] Add REST endpoints
- [ ] Hook into gateway events

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd ui && npm install

# Build UI
npm run build

# Run dev server (with hot reload)
npm run dev

# Run tests
npm test

# Type check
npm run typecheck
```

---

## 🔧 Configuration

### Metrics Collection
```typescript
// Default settings in MetricsController
reconnectDelay: 2000ms
maxReconnectAttempts: 5
reconnectBackoff: exponential

// Default settings in MetricsCollector
broadcastInterval: real-time (on change)
historyWindow: 60 seconds (messages)
responseTimes: last 100 samples
```

### Auto-Refresh
```typescript
// Channels health view
autoRefresh: true
refreshInterval: 5000ms // 5 seconds
```

---

## 💡 Common Patterns

### Recording a Message
```typescript
metricsCollector.recordMessage(channelName, sessionKey);
```

### Recording Response Time
```typescript
const start = Date.now();
// ... process message ...
metricsCollector.recordResponseTime(Date.now() - start);
```

### Recording Error
```typescript
try {
  // ... operation ...
} catch (err) {
  metricsCollector.recordError();
  throw err;
}
```

### Recording Model Usage
```typescript
metricsCollector.recordModelUsage(modelName, tokensUsed);
```

---

## 🎨 Styling

### CSS Variables Used
```css
--color-primary          /* Primary brand color */
--color-primary-light    /* Light primary for backgrounds */
--color-surface          /* Card/panel backgrounds */
--color-surface-hover    /* Hover state */
--color-border           /* Border color */
--color-text-primary     /* Primary text */
--color-text-secondary   /* Secondary/muted text */
```

### Dark Mode Support
All components automatically adapt to dark mode via CSS variables.

---

## 🐛 Debugging

### Check WebSocket Connection
```javascript
// Browser console
const ws = new WebSocket("ws://localhost:8080/api/v1/metrics/stream");
ws.onopen = () => console.log("Connected");
ws.onmessage = (e) => console.log("Data:", e.data);
ws.onerror = (e) => console.error("Error:", e);
```

### Check Metrics Collector
```typescript
// Backend
const snapshot = metricsCollector.getSnapshot();
console.log("Current metrics:", snapshot);
```

### Check Component Registration
```javascript
// Browser console
console.log(customElements.get("metric-card"));
console.log(customElements.get("session-list-item"));
console.log(customElements.get("channel-health-card"));
```

---

## 📦 Dependencies

### Production
- `lit@^3.3.2` - Web components
- `chart.js@^4.4.0` - Charts and graphs
- `date-fns@^3.0.0` - Date formatting
- `marked@^17.0.4` - Markdown (existing)
- `dompurify@^3.3.2` - XSS protection (existing)

### Development
- `vite@7.3.1` - Build tool
- `vitest@4.0.18` - Testing
- `playwright@^1.58.2` - E2E testing

---

## 🎯 Feature Matrix

| Feature | UI Status | Backend Status | Notes |
|---------|-----------|----------------|-------|
| Real-time Dashboard | ✅ Complete | ⏳ TODO | Charts ready, needs data |
| Session Browser | ✅ Complete | ⏳ TODO | Search/filter UI ready |
| Config Editor | ✅ Complete | ⏳ TODO | Visual editing ready |
| Channels Health | ✅ Complete | ⏳ TODO | Monitoring UI ready |
| WebSocket Metrics | ✅ Complete | ⏳ TODO | Client ready, need server |
| Export Sessions | ✅ Complete | ⏳ TODO | UI ready, need formatters |

---

## 📚 Key Files Reference

### Most Important Files
1. `ui/src/ui/views/dashboard.ts` - Main analytics dashboard
2. `ui/src/controllers/metrics-controller.ts` - WebSocket management
3. `ui/src/components/metric-card.ts` - Reusable metric display
4. Backend `metrics-collector.ts` - ⏳ TODO
5. Backend `metrics-stream.ts` - ⏳ TODO

### Integration Points
1. `ui/src/ui/app.ts` - Add navigation
2. `ui/src/ui/app-render.ts` - Add render cases
3. `src/gateway/boot.ts` - Initialize services
4. HTTP server - Add endpoints
5. WebSocket server - Add upgrade handler

---

## 🎓 Best Practices

### Frontend
- ✅ Use TypeScript strictly (no `any`)
- ✅ Components are self-contained
- ✅ State is localized where possible
- ✅ Error handling on all async operations
- ✅ Accessible UI (ARIA labels, keyboard nav)

### Backend
- ⚠️ Validate all user input
- ⚠️ Sanitize config before sending to client
- ⚠️ Rate limit WebSocket connections
- ⚠️ Clean up subscriptions on disconnect
- ⚠️ Log errors with context

---

## 🔗 Related Documentation

- **Full Summary**: `DASHBOARD_IMPLEMENTATION_SUMMARY.md`
- **Integration Guide**: `DASHBOARD_INTEGRATION_GUIDE.md`
- **Component Docs**: See inline JSDoc in source files
- **API Spec**: See integration guide for full API documentation

---

## ✨ Quick Tips

1. **Start with metrics** - Get the collector working first
2. **Test WebSocket** - Use browser console to verify connection
3. **Mock data** - Create fake metrics to test charts
4. **Use dev tools** - Browser DevTools → Network tab for debugging
5. **Check logs** - Backend logs will show collection events

---

**Last Updated**: March 11, 2026
**Version**: 1.0.0
**Status**: Frontend Complete, Backend TODO
