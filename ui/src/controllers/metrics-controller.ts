import { ReactiveController, ReactiveControllerHost } from "lit";

export type MetricsData = {
  timestamp: number;
  messagesPerMinute: number;
  avgResponseTime: number;
  activeSessionsCount: number;
  errorRate: number;
  channelActivity: Record<string, number>;
  modelUsage: Record<string, { tokens: number; requests: number }>;
};

export type MetricsStreamEvent = {
  type: "metrics";
  data: MetricsData;
} | {
  type: "error";
  message: string;
} | {
  type: "connected";
} | {
  type: "disconnected";
};

export class MetricsController implements ReactiveController {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  public connected = false;
  public error: string | null = null;
  public latestMetrics: MetricsData | null = null;

  constructor(
    private host: ReactiveControllerHost,
    private wsUrl: string,
    private onMetrics?: (data: MetricsData) => void
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.connect();
  }

  hostDisconnected() {
    this.disconnect();
  }

  private connect() {
    if (this.ws) {
      return;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.addEventListener("open", () => {
        this.connected = true;
        this.error = null;
        this.reconnectAttempts = 0;
        this.host.requestUpdate();
      });

      this.ws.addEventListener("message", (event) => {
        try {
          const parsed = JSON.parse(event.data) as MetricsStreamEvent;

          if (parsed.type === "metrics") {
            this.latestMetrics = parsed.data;
            this.onMetrics?.(parsed.data);
            this.host.requestUpdate();
          } else if (parsed.type === "error") {
            this.error = parsed.message;
            this.host.requestUpdate();
          }
        } catch (err) {
          console.error("Failed to parse metrics message:", err);
        }
      });

      this.ws.addEventListener("close", () => {
        this.connected = false;
        this.ws = null;
        this.host.requestUpdate();
        this.scheduleReconnect();
      });

      this.ws.addEventListener("error", () => {
        this.error = "WebSocket connection error";
        this.host.requestUpdate();
      });
    } catch (err) {
      this.error = `Failed to connect: ${String(err)}`;
      this.host.requestUpdate();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.error = "Max reconnection attempts reached";
      this.host.requestUpdate();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private disconnect() {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    this.host.requestUpdate();
  }

  public refresh() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}
