import { html } from "lit";
import type { AppViewState } from "../app-view-state.js";
import "../../components/metric-card.js";
import { MetricsController } from "../../controllers/metrics-controller.js";
import {
  Chart,
  LineController,
  BarController,
  PieController,
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from "chart.js";

// Register Chart.js components
Chart.register(
  LineController,
  BarController,
  PieController,
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

export type DashboardState = {
  metricsController?: MetricsController;
  messageChart?: Chart;
  responseTimeChart?: Chart;
  channelActivityChart?: Chart;
  modelUsageChart?: Chart;
  metricsHistory: Array<{
    timestamp: number;
    messagesPerMinute: number;
    avgResponseTime: number;
    activeSessionsCount: number;
    errorRate: number;
  }>;
};

const dashboardState: DashboardState = {
  metricsHistory: [],
};

function initializeMetricsController(host: AppViewState) {
  if (dashboardState.metricsController) {
    return dashboardState.metricsController;
  }

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}/api/v1/metrics/stream`;

  const controller = new MetricsController(host as any, wsUrl, (data) => {
    dashboardState.metricsHistory.push({
      timestamp: data.timestamp,
      messagesPerMinute: data.messagesPerMinute,
      avgResponseTime: data.avgResponseTime,
      activeSessionsCount: data.activeSessionsCount,
      errorRate: data.errorRate,
    });

    // Keep only last 50 data points
    if (dashboardState.metricsHistory.length > 50) {
      dashboardState.metricsHistory.shift();
    }

    updateCharts();
  });

  dashboardState.metricsController = controller;
  return controller;
}

function updateCharts() {
  const { messageChart, responseTimeChart, channelActivityChart, modelUsageChart } = dashboardState;
  const { metricsHistory } = dashboardState;
  const latestMetrics = dashboardState.metricsController?.latestMetrics;

  if (messageChart && metricsHistory.length > 0) {
    messageChart.data.labels = metricsHistory.map((m) =>
      new Date(m.timestamp).toLocaleTimeString()
    );
    messageChart.data.datasets[0].data = metricsHistory.map((m) => m.messagesPerMinute);
    messageChart.update("none");
  }

  if (responseTimeChart && metricsHistory.length > 0) {
    responseTimeChart.data.labels = metricsHistory.map((m) =>
      new Date(m.timestamp).toLocaleTimeString()
    );
    responseTimeChart.data.datasets[0].data = metricsHistory.map((m) => m.avgResponseTime);
    responseTimeChart.update("none");
  }

  if (channelActivityChart && latestMetrics?.channelActivity) {
    const channels = Object.keys(latestMetrics.channelActivity);
    const values = Object.values(latestMetrics.channelActivity);
    channelActivityChart.data.labels = channels;
    channelActivityChart.data.datasets[0].data = values;
    channelActivityChart.update("none");
  }

  if (modelUsageChart && latestMetrics?.modelUsage) {
    const models = Object.keys(latestMetrics.modelUsage);
    const tokenCounts = models.map((m) => latestMetrics.modelUsage[m].tokens);
    modelUsageChart.data.labels = models;
    modelUsageChart.data.datasets[0].data = tokenCounts;
    modelUsageChart.update("none");
  }
}

function initializeChart(
  canvas: HTMLCanvasElement,
  config: ChartConfiguration
): Chart | null {
  try {
    return new Chart(canvas, config);
  } catch (err) {
    console.error("Failed to initialize chart:", err);
    return null;
  }
}

function setupCharts() {
  const messageCanvas = document.getElementById("message-throughput-chart") as HTMLCanvasElement;
  const responseCanvas = document.getElementById("response-time-chart") as HTMLCanvasElement;
  const channelCanvas = document.getElementById("channel-activity-chart") as HTMLCanvasElement;
  const modelCanvas = document.getElementById("model-usage-chart") as HTMLCanvasElement;

  if (messageCanvas && !dashboardState.messageChart) {
    dashboardState.messageChart = initializeChart(messageCanvas, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Messages/Minute",
            data: [],
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  if (responseCanvas && !dashboardState.responseTimeChart) {
    dashboardState.responseTimeChart = initializeChart(responseCanvas, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Response Time (ms)",
            data: [],
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderColor: "rgb(16, 185, 129)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  if (channelCanvas && !dashboardState.channelActivityChart) {
    dashboardState.channelActivityChart = initializeChart(channelCanvas, {
      type: "pie",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(245, 158, 11, 0.7)",
              "rgba(239, 68, 68, 0.7)",
              "rgba(139, 92, 246, 0.7)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right" },
          title: { display: false },
        },
      },
    });
  }

  if (modelCanvas && !dashboardState.modelUsageChart) {
    dashboardState.modelUsageChart = initializeChart(modelCanvas, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Tokens Used",
            data: [],
            backgroundColor: "rgba(139, 92, 246, 0.7)",
            borderColor: "rgb(139, 92, 246)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          x: { beginAtZero: true },
        },
      },
    });
  }
}

export function renderDashboard(host: AppViewState) {
  const controller = initializeMetricsController(host);
  const metrics = controller.latestMetrics;

  setTimeout(() => setupCharts(), 100);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  };

  return html`
    <div style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="margin: 0 0 0.5rem 0; font-size: 1.75rem;">Real-Time Analytics</h1>
          <p style="margin: 0; color: var(--color-text-secondary);">
            Monitor system performance and usage metrics
          </p>
        </div>
        <button
          @click=${() => controller.refresh()}
          style="padding: 0.5rem 1rem; border: 1px solid var(--color-border); border-radius: 4px; background: white; cursor: pointer;"
        >
          🔄 Refresh
        </button>
      </div>

      ${controller.error ? html`
        <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 4px; padding: 1rem; margin-bottom: 1rem;">
          <strong>Error:</strong> ${controller.error}
        </div>
      ` : ""}

      ${!controller.connected ? html`
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 1rem; margin-bottom: 1rem;">
          Connecting to metrics stream...
        </div>
      ` : ""}

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <metric-card
          label="Messages/Minute"
          value="${metrics?.messagesPerMinute.toFixed(1) || "0"}"
          trend="+12% from last hour"
          trendDirection="up"
          icon="📨"
          variant="default"
        ></metric-card>

        <metric-card
          label="Avg Response Time"
          value="${metrics?.avgResponseTime.toFixed(0) || "0"}ms"
          trend="-8% faster"
          trendDirection="down"
          icon="⚡"
          variant="success"
        ></metric-card>

        <metric-card
          label="Active Sessions"
          value="${metrics?.activeSessionsCount || 0}"
          trend="3 new today"
          trendDirection="up"
          icon="👥"
          variant="default"
        ></metric-card>

        <metric-card
          label="Error Rate"
          value="${metrics?.errorRate.toFixed(2) || "0"}%"
          trend="${metrics?.errorRate > 1 ? "Needs attention" : "Normal"}"
          trendDirection="${metrics?.errorRate > 1 ? "up" : "neutral"}"
          icon="⚠️"
          variant="${metrics?.errorRate > 1 ? "warning" : "success"}"
        ></metric-card>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600;">
            Message Throughput
          </h3>
          <div style="height: 250px;">
            <canvas id="message-throughput-chart"></canvas>
          </div>
        </div>

        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600;">
            Response Time
          </h3>
          <div style="height: 250px;">
            <canvas id="response-time-chart"></canvas>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600;">
            Channel Activity
          </h3>
          <div style="height: 250px;">
            <canvas id="channel-activity-chart"></canvas>
          </div>
        </div>

        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600;">
            Model Usage
          </h3>
          <div style="height: 250px;">
            <canvas id="model-usage-chart"></canvas>
          </div>
        </div>
      </div>

      ${metrics?.modelUsage ? html`
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem; margin-top: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600;">
            Token Usage by Model
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--color-border);">
                <th style="text-align: left; padding: 0.5rem;">Model</th>
                <th style="text-align: right; padding: 0.5rem;">Tokens</th>
                <th style="text-align: right; padding: 0.5rem;">Requests</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(metrics.modelUsage).map(
                ([model, usage]) => html`
                  <tr style="border-bottom: 1px solid var(--color-border);">
                    <td style="padding: 0.5rem;">${model}</td>
                    <td style="text-align: right; padding: 0.5rem;">${formatNumber(usage.tokens)}</td>
                    <td style="text-align: right; padding: 0.5rem;">${usage.requests}</td>
                  </tr>
                `
              )}
            </tbody>
          </table>
        </div>
      ` : ""}
    </div>
  `;
}
