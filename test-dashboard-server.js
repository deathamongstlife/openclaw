#!/usr/bin/env node
/**
 * Simple HTTP server to test the Jarvis dashboard
 * Serves the built UI from dist/control-ui/
 */

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8080;
const UI_DIR = join(__dirname, "dist", "control-ui");

// Mock API responses for testing
const mockMetrics = {
  messages: { total: 1547, rate: 23.5, trend: "up" },
  responseTime: { avg: 850, p95: 1200, trend: "down" },
  errors: { total: 12, rate: 0.8, trend: "down" },
  sessions: { active: 34, total: 156 },
  channels: {
    discord: { status: "connected", uptime: 0.998, messages: 843 },
    slack: { status: "connected", uptime: 0.995, messages: 524 },
    telegram: { status: "disconnected", uptime: 0.0, messages: 0 },
  },
  models: {
    "claude-3-5-sonnet": { calls: 523, tokens: 1247832 },
    "gpt-4": { calls: 124, tokens: 324567 },
  },
};

const mockSessions = Array.from({ length: 50 }, (_, i) => ({
  key: `agent:discord:user${i}`,
  channel: ["discord", "slack", "telegram"][i % 3],
  messageCount: Math.floor(Math.random() * 100) + 10,
  lastActive: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  userId: `user${i}`,
}));

// MIME types
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function getMimeType(filepath) {
  const ext = filepath.substring(filepath.lastIndexOf("."));
  return MIME_TYPES[ext] || "application/octet-stream";
}

const server = createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle API requests (mock)
  if (req.url.startsWith("/api/")) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.url === "/api/v1/metrics/realtime") {
      res.writeHead(200);
      res.end(JSON.stringify(mockMetrics));
      return;
    }

    if (req.url === "/api/v1/sessions") {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      res.writeHead(200);
      res.end(
        JSON.stringify({
          sessions: mockSessions.slice(offset, offset + limit),
          total: mockSessions.length,
          limit,
          offset,
        }),
      );
      return;
    }

    if (req.url.match(/^\/api\/v1\/sessions\/[^/]+$/)) {
      const key = req.url.split("/").pop();
      const session = mockSessions.find((s) => s.key === key);

      if (session) {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            ...session,
            messages: [
              { role: "user", content: "Hello!", timestamp: new Date().toISOString() },
              {
                role: "assistant",
                content: "Hi! How can I help?",
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        );
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Session not found" }));
      }
      return;
    }

    // 404 for unknown API routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // Serve static files
  let filepath = req.url === "/" ? "/index.html" : req.url;
  filepath = join(UI_DIR, filepath);

  try {
    const data = await readFile(filepath);
    const mimeType = getMimeType(filepath);

    res.setHeader("Content-Type", mimeType);
    res.writeHead(200);
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // Try serving index.html for SPA routing
      try {
        const indexData = await readFile(join(UI_DIR, "index.html"));
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end(indexData);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    } else {
      console.error("Error serving file:", error);
      res.writeHead(500);
      res.end("Internal server error");
    }
  }
});

server.listen(PORT, () => {
  console.log(`✅ Dashboard test server running at http://localhost:${PORT}`);
  console.log(`📁 Serving from: ${UI_DIR}`);
  console.log(`🔄 Mock APIs available at /api/*`);
  console.log("");
  console.log("Press Ctrl+C to stop");
});
