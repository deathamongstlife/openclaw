/**
 * Virtualized sessions list controller for handling 100+ sessions
 * Addresses issue #43268 - Session list performance degradation
 */

import type { GatewayBrowserClient } from "../gateway.ts";
import type { SessionsListResult, SessionEntry } from "../types.ts";

export type VirtualizedSessionsState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  sessionsLoading: boolean;
  allSessions: SessionEntry[];
  visibleSessions: SessionEntry[];
  scrollOffset: number;
  viewportHeight: number;
  itemHeight: number;
  overscanCount: number;
  totalHeight: number;
  sessionsError: string | null;
  sessionsFilterActive: string;
  sessionsFilterLimit: string;
  sessionsIncludeGlobal: boolean;
  sessionsIncludeUnknown: boolean;
};

/**
 * Calculate visible range for virtualization
 */
export function calculateVisibleRange(
  scrollOffset: number,
  viewportHeight: number,
  itemHeight: number,
  totalItems: number,
  overscanCount: number,
): { startIndex: number; endIndex: number; offsetY: number } {
  const visibleStart = Math.floor(scrollOffset / itemHeight);
  const visibleEnd = Math.ceil((scrollOffset + viewportHeight) / itemHeight);

  const startIndex = Math.max(0, visibleStart - overscanCount);
  const endIndex = Math.min(totalItems, visibleEnd + overscanCount);
  const offsetY = startIndex * itemHeight;

  return { startIndex, endIndex, offsetY };
}

/**
 * Update visible sessions based on scroll position
 */
export function updateVisibleSessions(state: VirtualizedSessionsState) {
  const { startIndex, endIndex } = calculateVisibleRange(
    state.scrollOffset,
    state.viewportHeight,
    state.itemHeight,
    state.allSessions.length,
    state.overscanCount,
  );

  state.visibleSessions = state.allSessions.slice(startIndex, endIndex);
  state.totalHeight = state.allSessions.length * state.itemHeight;
}

/**
 * Handle scroll event
 */
export function handleSessionsScroll(state: VirtualizedSessionsState, scrollTop: number) {
  state.scrollOffset = scrollTop;
  updateVisibleSessions(state);
}

/**
 * Load sessions with pagination support
 */
export async function loadSessionsPaginated(
  state: VirtualizedSessionsState,
  options?: {
    offset?: number;
    limit?: number;
    activeMinutes?: number;
    includeGlobal?: boolean;
    includeUnknown?: boolean;
  },
) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.sessionsLoading) {
    return;
  }

  state.sessionsLoading = true;
  state.sessionsError = null;

  try {
    const params: Record<string, unknown> = {
      includeGlobal: options?.includeGlobal ?? state.sessionsIncludeGlobal,
      includeUnknown: options?.includeUnknown ?? state.sessionsIncludeUnknown,
      offset: options?.offset ?? 0,
      limit: options?.limit ?? 100,
    };

    if (options?.activeMinutes && options.activeMinutes > 0) {
      params.activeMinutes = options.activeMinutes;
    }

    const res = await state.client.request<SessionsListResult | undefined>(
      "sessions.list",
      params,
    );

    if (res && res.sessions) {
      if (params.offset === 0) {
        state.allSessions = res.sessions;
      } else {
        state.allSessions = [...state.allSessions, ...res.sessions];
      }
      updateVisibleSessions(state);
    }
  } catch (err) {
    state.sessionsError = String(err);
  } finally {
    state.sessionsLoading = false;
  }
}

/**
 * Search sessions with debouncing
 */
let sessionSearchTimeout: number | null = null;

export function searchSessions(
  state: VirtualizedSessionsState,
  query: string,
  debounceMs = 300,
) {
  if (sessionSearchTimeout) {
    clearTimeout(sessionSearchTimeout);
  }

  sessionSearchTimeout = window.setTimeout(() => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
      updateVisibleSessions(state);
      return;
    }

    state.allSessions = state.allSessions.filter((session) => {
      const label = session.label?.toLowerCase() || "";
      const key = session.key?.toLowerCase() || "";
      return label.includes(lowerQuery) || key.includes(lowerQuery);
    });

    updateVisibleSessions(state);
  }, debounceMs);
}
