import { html } from "lit";
import type { AppViewState } from "../app-view-state.js";
import "../../components/channel-health-card.js";
import type { ChannelHealthData } from "../../components/channel-health-card.js";

export type ChannelsHealthState = {
  loading: boolean;
  error: string | null;
  channels: ChannelHealthData[];
  autoRefresh: boolean;
  refreshInterval: number;
};

const channelsHealthState: ChannelsHealthState = {
  loading: false,
  error: null,
  channels: [],
  autoRefresh: true,
  refreshInterval: 5000,
};

let refreshTimer: number | null = null;

async function loadChannelsHealth(host: AppViewState) {
  channelsHealthState.loading = true;
  channelsHealthState.error = null;
  host.requestUpdate();

  try {
    const response = await fetch("/api/v1/channels/health");
    if (!response.ok) {
      throw new Error(`Failed to load channels health: ${response.statusText}`);
    }

    const data = await response.json();
    channelsHealthState.channels = data.channels || [];
  } catch (err) {
    channelsHealthState.error = String(err);
  } finally {
    channelsHealthState.loading = false;
    host.requestUpdate();
  }

  if (channelsHealthState.autoRefresh) {
    scheduleRefresh(host);
  }
}

function scheduleRefresh(host: AppViewState) {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer);
  }

  refreshTimer = window.setTimeout(() => {
    loadChannelsHealth(host);
  }, channelsHealthState.refreshInterval);
}

function stopRefresh() {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

async function handleChannelAction(
  host: AppViewState,
  channelName: string,
  action: "enable" | "disable" | "restart"
) {
  try {
    const response = await fetch(`/api/v1/channels/${encodeURIComponent(channelName)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      throw new Error(`Action failed: ${response.statusText}`);
    }

    await loadChannelsHealth(host);
  } catch (err) {
    alert(`Failed to ${action} channel: ${String(err)}`);
  }
}

export function renderChannelsHealth(host: AppViewState) {
  if (channelsHealthState.channels.length === 0 && !channelsHealthState.loading) {
    setTimeout(() => loadChannelsHealth(host), 100);
  }

  const connectedCount = channelsHealthState.channels.filter((c) => c.status === "connected").length;
  const errorCount = channelsHealthState.channels.filter((c) => c.status === "error").length;
  const totalMessages = channelsHealthState.channels.reduce((sum, c) => sum + c.messageCount, 0);
  const totalErrors = channelsHealthState.channels.reduce((sum, c) => sum + c.errorCount, 0);

  return html`
    <div style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="margin: 0 0 0.5rem 0; font-size: 1.75rem;">Channel Health Monitor</h1>
          <p style="margin: 0; color: var(--color-text-secondary);">
            Monitor and manage messaging channel connections
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
            <input
              type="checkbox"
              .checked=${channelsHealthState.autoRefresh}
              @change=${(e: Event) => {
                channelsHealthState.autoRefresh = (e.target as HTMLInputElement).checked;
                if (channelsHealthState.autoRefresh) {
                  scheduleRefresh(host);
                } else {
                  stopRefresh();
                }
                host.requestUpdate();
              }}
            />
            Auto-refresh
          </label>
          <button
            @click=${() => loadChannelsHealth(host)}
            ?disabled=${channelsHealthState.loading}
            style="padding: 0.5rem 1rem; border: 1px solid var(--color-border); border-radius: 4px; background: white; cursor: pointer;"
          >
            🔄 ${channelsHealthState.loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      ${channelsHealthState.error ? html`
        <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 4px; padding: 1rem; margin-bottom: 1rem;">
          <strong>Error:</strong> ${channelsHealthState.error}
        </div>
      ` : ""}

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem;">
          <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
            Connected Channels
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: ${connectedCount > 0 ? "#10b981" : "#6b7280"};">
            ${connectedCount}/${channelsHealthState.channels.length}
          </div>
        </div>

        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem;">
          <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
            Total Messages
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--color-text-primary);">
            ${totalMessages.toLocaleString()}
          </div>
        </div>

        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem;">
          <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
            Channels with Errors
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: ${errorCount > 0 ? "#ef4444" : "#10b981"};">
            ${errorCount}
          </div>
        </div>

        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem;">
          <div style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
            Total Errors
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: ${totalErrors > 0 ? "#ef4444" : "#10b981"};">
            ${totalErrors}
          </div>
        </div>
      </div>

      ${channelsHealthState.loading && channelsHealthState.channels.length === 0 ? html`
        <div style="padding: 3rem; text-align: center; color: var(--color-text-secondary);">
          Loading channels...
        </div>
      ` : channelsHealthState.channels.length === 0 ? html`
        <div style="padding: 3rem; text-align: center; color: var(--color-text-secondary);">
          No channels configured
        </div>
      ` : html`
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1rem;">
          ${channelsHealthState.channels.map(
            (channel) => html`
              <channel-health-card
                .channel=${channel}
                @channel-action=${(e: CustomEvent) => {
                  handleChannelAction(host, e.detail.channel, e.detail.action);
                }}
              ></channel-health-card>
            `
          )}
        </div>
      `}

      <div style="margin-top: 2rem; padding: 1rem; background: #f9fafb; border-radius: 8px;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">Channel Status Legend</h3>
        <div style="display: flex; gap: 2rem; font-size: 0.875rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #10b981;"></div>
            <span>Connected</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #f59e0b;"></div>
            <span>Initializing</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #6b7280;"></div>
            <span>Disconnected</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ef4444;"></div>
            <span>Error</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function cleanupChannelsHealth() {
  stopRefresh();
}
