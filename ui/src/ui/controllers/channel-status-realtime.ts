/**
 * Real-time channel status updates
 * Addresses issue #43206 - Channel status indicators stuck
 */

import type { GatewayBrowserClient } from "../gateway.ts";
import type { ChannelStatus, ChannelsSnapshot } from "../types.ts";

export type ChannelStatusState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  channelsSnapshot: ChannelsSnapshot | null;
  channelStatuses: Map<string, ChannelStatus>;
  lastUpdated: Map<string, number>;
  pollingEnabled: boolean;
  pollingInterval: number;
  staleThresholdMs: number;
};

const DEFAULT_POLLING_INTERVAL = 5000;
const DEFAULT_STALE_THRESHOLD = 15000;

let statusPollingTimer: number | null = null;

/**
 * Check if channel status is stale
 */
export function isChannelStatusStale(
  state: ChannelStatusState,
  channelId: string,
): boolean {
  const lastUpdated = state.lastUpdated.get(channelId);
  if (!lastUpdated) {
    return true;
  }
  return Date.now() - lastUpdated > state.staleThresholdMs;
}

/**
 * Update channel status
 */
export function updateChannelStatus(
  state: ChannelStatusState,
  channelId: string,
  status: ChannelStatus,
) {
  state.channelStatuses.set(channelId, status);
  state.lastUpdated.set(channelId, Date.now());
}

/**
 * Get channel status with staleness indicator
 */
export function getChannelStatus(
  state: ChannelStatusState,
  channelId: string,
): { status: ChannelStatus | null; isStale: boolean } {
  const status = state.channelStatuses.get(channelId) ?? null;
  const isStale = isChannelStatusStale(state, channelId);
  return { status, isStale };
}

/**
 * Poll channel statuses
 */
async function pollChannelStatuses(state: ChannelStatusState) {
  if (!state.client || !state.connected || !state.pollingEnabled) {
    return;
  }

  try {
    const snapshot = await state.client.request<ChannelsSnapshot>("channels.list", {
      probe: true,
    });

    if (snapshot && snapshot.channels) {
      for (const channel of snapshot.channels) {
        if (channel.id && channel.status) {
          updateChannelStatus(state, channel.id, channel.status);
        }
      }
      state.channelsSnapshot = snapshot;
    }
  } catch (err) {
    console.error("Failed to poll channel statuses:", err);
  }
}

/**
 * Start polling channel statuses
 */
export function startChannelStatusPolling(state: ChannelStatusState) {
  if (statusPollingTimer !== null) {
    return;
  }

  state.pollingEnabled = true;

  const poll = () => {
    void pollChannelStatuses(state);
    if (state.pollingEnabled) {
      statusPollingTimer = window.setTimeout(poll, state.pollingInterval);
    }
  };

  poll();
}

/**
 * Stop polling channel statuses
 */
export function stopChannelStatusPolling(state: ChannelStatusState) {
  state.pollingEnabled = false;
  if (statusPollingTimer !== null) {
    clearTimeout(statusPollingTimer);
    statusPollingTimer = null;
  }
}

/**
 * Force refresh channel status
 */
export async function refreshChannelStatus(
  state: ChannelStatusState,
  channelId?: string,
) {
  if (!state.client || !state.connected) {
    return;
  }

  try {
    const snapshot = await state.client.request<ChannelsSnapshot>("channels.list", {
      probe: true,
    });

    if (snapshot && snapshot.channels) {
      for (const channel of snapshot.channels) {
        if (channel.id && channel.status) {
          if (!channelId || channel.id === channelId) {
            updateChannelStatus(state, channel.id, channel.status);
          }
        }
      }
      state.channelsSnapshot = snapshot;
    }
  } catch (err) {
    console.error("Failed to refresh channel status:", err);
  }
}

/**
 * Initialize channel status state
 */
export function initializeChannelStatusState(
  client: GatewayBrowserClient | null,
): ChannelStatusState {
  return {
    client,
    connected: false,
    channelsSnapshot: null,
    channelStatuses: new Map(),
    lastUpdated: new Map(),
    pollingEnabled: false,
    pollingInterval: DEFAULT_POLLING_INTERVAL,
    staleThresholdMs: DEFAULT_STALE_THRESHOLD,
  };
}

/**
 * Get channel status display
 */
export function getChannelStatusDisplay(status: ChannelStatus | null): {
  text: string;
  color: string;
  icon: string;
} {
  if (!status) {
    return {
      text: "Unknown",
      color: "gray",
      icon: "?",
    };
  }

  switch (status) {
    case "connected":
      return {
        text: "Connected",
        color: "green",
        icon: "●",
      };
    case "connecting":
      return {
        text: "Connecting",
        color: "yellow",
        icon: "◐",
      };
    case "disconnected":
      return {
        text: "Disconnected",
        color: "red",
        icon: "○",
      };
    case "error":
      return {
        text: "Error",
        color: "red",
        icon: "✕",
      };
    default:
      return {
        text: String(status),
        color: "gray",
        icon: "?",
      };
  }
}

/**
 * Subscribe to channel events
 */
export function subscribeToChannelEvents(
  state: ChannelStatusState,
  callback: (channelId: string, status: ChannelStatus) => void,
): () => void {
  if (!state.client) {
    return () => {};
  }

  const handler = (event: unknown) => {
    const channelEvent = event as {
      channelId?: string;
      status?: ChannelStatus;
    };

    if (channelEvent.channelId && channelEvent.status) {
      updateChannelStatus(state, channelEvent.channelId, channelEvent.status);
      callback(channelEvent.channelId, channelEvent.status);
    }
  };

  // Subscribe to channel events (implementation depends on event system)
  // This is a placeholder for the actual event subscription

  return () => {
    // Unsubscribe cleanup
  };
}
