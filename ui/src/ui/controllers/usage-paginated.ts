/**
 * Paginated usage controller for handling large date ranges
 * Addresses issue #43237 - Usage tab doesn't load for large date ranges
 */

import type { GatewayBrowserClient } from "../gateway.ts";
import type { SessionsUsageResult, SessionUsage } from "../types.ts";

const MAX_SESSIONS_PER_PAGE = 1000;
const MAX_DATE_RANGE_DAYS = 90;

export type PaginatedUsageState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  startDate: string;
  endDate: string;
  currentPage: number;
  totalPages: number;
  sessionsPerPage: number;
  allSessions: SessionUsage[];
  displayedSessions: SessionUsage[];
  hasMore: boolean;
};

/**
 * Calculate date range in days
 */
function calculateDateRangeDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
): { valid: boolean; error?: string } {
  const rangeDays = calculateDateRangeDays(startDate, endDate);

  if (rangeDays > MAX_DATE_RANGE_DAYS) {
    return {
      valid: false,
      error: `Date range too large. Maximum ${MAX_DATE_RANGE_DAYS} days allowed. Current range: ${rangeDays} days.`,
    };
  }

  if (rangeDays < 0) {
    return {
      valid: false,
      error: "End date must be after start date.",
    };
  }

  return { valid: true };
}

/**
 * Load usage data with pagination
 */
export async function loadUsagePaginated(
  state: PaginatedUsageState,
  options?: {
    page?: number;
    resetPagination?: boolean;
  },
) {
  if (!state.client || !state.connected) {
    return;
  }

  if (state.loading) {
    return;
  }

  const validation = validateDateRange(state.startDate, state.endDate);
  if (!validation.valid) {
    state.error = validation.error ?? "Invalid date range";
    return;
  }

  state.loading = true;
  state.error = null;

  const targetPage = options?.page ?? state.currentPage;
  const offset = targetPage * state.sessionsPerPage;

  try {
    const params: Record<string, unknown> = {
      startDate: state.startDate,
      endDate: state.endDate,
      limit: state.sessionsPerPage,
      offset,
    };

    const result = await state.client.request<SessionsUsageResult | undefined>(
      "sessions.usage",
      params,
    );

    if (!result) {
      state.error = "No usage data returned";
      return;
    }

    if (options?.resetPagination) {
      state.allSessions = result.sessions ?? [];
      state.currentPage = 0;
    } else {
      if (targetPage === 0) {
        state.allSessions = result.sessions ?? [];
      } else {
        state.allSessions = [...state.allSessions, ...(result.sessions ?? [])];
      }
      state.currentPage = targetPage;
    }

    state.displayedSessions = result.sessions ?? [];
    state.hasMore = (result.sessions?.length ?? 0) >= state.sessionsPerPage;
    state.totalPages = Math.ceil((result.total ?? state.allSessions.length) / state.sessionsPerPage);
  } catch (err) {
    state.error = String(err);
  } finally {
    state.loading = false;
  }
}

/**
 * Load next page
 */
export async function loadNextPage(state: PaginatedUsageState) {
  if (!state.hasMore || state.loading) {
    return;
  }
  await loadUsagePaginated(state, { page: state.currentPage + 1 });
}

/**
 * Load previous page
 */
export async function loadPreviousPage(state: PaginatedUsageState) {
  if (state.currentPage === 0 || state.loading) {
    return;
  }
  await loadUsagePaginated(state, { page: state.currentPage - 1 });
}

/**
 * Reset pagination and reload
 */
export async function resetUsagePagination(state: PaginatedUsageState) {
  state.currentPage = 0;
  state.allSessions = [];
  state.displayedSessions = [];
  await loadUsagePaginated(state, { resetPagination: true });
}

/**
 * Split large date range into smaller chunks
 */
export function splitDateRange(
  startDate: string,
  endDate: string,
  chunkSizeDays: number,
): Array<{ start: string; end: string }> {
  const chunks: Array<{ start: string; end: string }> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentStart = new Date(start);
  while (currentStart < end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + chunkSizeDays);

    if (currentEnd > end) {
      chunks.push({
        start: currentStart.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      });
      break;
    }

    chunks.push({
      start: currentStart.toISOString().split("T")[0],
      end: currentEnd.toISOString().split("T")[0],
    });

    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return chunks;
}

/**
 * Load usage in chunks for large date ranges
 */
export async function loadUsageInChunks(
  state: PaginatedUsageState,
  progressCallback?: (current: number, total: number) => void,
) {
  if (!state.client || !state.connected) {
    return;
  }

  const rangeDays = calculateDateRangeDays(state.startDate, state.endDate);
  if (rangeDays <= MAX_DATE_RANGE_DAYS) {
    return loadUsagePaginated(state, { resetPagination: true });
  }

  state.loading = true;
  state.error = null;
  state.allSessions = [];

  const chunks = splitDateRange(state.startDate, state.endDate, MAX_DATE_RANGE_DAYS);

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const params: Record<string, unknown> = {
        startDate: chunk.start,
        endDate: chunk.end,
        limit: state.sessionsPerPage,
        offset: 0,
      };

      const result = await state.client.request<SessionsUsageResult | undefined>(
        "sessions.usage",
        params,
      );

      if (result?.sessions) {
        state.allSessions = [...state.allSessions, ...result.sessions];
      }

      if (progressCallback) {
        progressCallback(i + 1, chunks.length);
      }
    }

    state.displayedSessions = state.allSessions.slice(0, state.sessionsPerPage);
    state.currentPage = 0;
    state.hasMore = state.allSessions.length > state.sessionsPerPage;
    state.totalPages = Math.ceil(state.allSessions.length / state.sessionsPerPage);
  } catch (err) {
    state.error = String(err);
  } finally {
    state.loading = false;
  }
}
