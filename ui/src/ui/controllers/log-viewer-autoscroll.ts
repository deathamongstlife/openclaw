/**
 * Log viewer with auto-scroll functionality
 * Addresses issue #43152 - Log viewer doesn't auto-scroll
 */

export type LogViewerState = {
  logs: string[];
  autoScrollEnabled: boolean;
  scrollContainer: HTMLElement | null;
  userScrolledUp: boolean;
  scrollThreshold: number;
  maxLogs: number;
};

const DEFAULT_SCROLL_THRESHOLD = 100;
const DEFAULT_MAX_LOGS = 10000;

/**
 * Check if user has manually scrolled up
 */
export function detectUserScroll(container: HTMLElement): boolean {
  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;

  const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
  return distanceFromBottom > DEFAULT_SCROLL_THRESHOLD;
}

/**
 * Scroll to bottom of log container
 */
export function scrollToBottom(container: HTMLElement, smooth = false) {
  container.scrollTo({
    top: container.scrollHeight,
    behavior: smooth ? "smooth" : "auto",
  });
}

/**
 * Add log entry
 */
export function addLogEntry(state: LogViewerState, log: string) {
  state.logs.push(log);

  if (state.logs.length > state.maxLogs) {
    const removeCount = state.logs.length - state.maxLogs;
    state.logs.splice(0, removeCount);
  }

  if (state.autoScrollEnabled && !state.userScrolledUp && state.scrollContainer) {
    requestAnimationFrame(() => {
      if (state.scrollContainer) {
        scrollToBottom(state.scrollContainer, false);
      }
    });
  }
}

/**
 * Add multiple log entries
 */
export function addLogEntries(state: LogViewerState, logs: string[]) {
  for (const log of logs) {
    addLogEntry(state, log);
  }
}

/**
 * Clear all logs
 */
export function clearLogs(state: LogViewerState) {
  state.logs = [];
  if (state.scrollContainer) {
    state.scrollContainer.scrollTop = 0;
  }
}

/**
 * Toggle auto-scroll
 */
export function toggleAutoScroll(state: LogViewerState) {
  state.autoScrollEnabled = !state.autoScrollEnabled;

  if (state.autoScrollEnabled && state.scrollContainer) {
    state.userScrolledUp = false;
    scrollToBottom(state.scrollContainer, true);
  }
}

/**
 * Handle scroll event
 */
export function handleScroll(state: LogViewerState) {
  if (!state.scrollContainer) {
    return;
  }

  state.userScrolledUp = detectUserScroll(state.scrollContainer);

  if (!state.userScrolledUp && !state.autoScrollEnabled) {
    state.autoScrollEnabled = true;
  }
}

/**
 * Initialize log viewer state
 */
export function initializeLogViewerState(
  container: HTMLElement | null,
): LogViewerState {
  return {
    logs: [],
    autoScrollEnabled: true,
    scrollContainer: container,
    userScrolledUp: false,
    scrollThreshold: DEFAULT_SCROLL_THRESHOLD,
    maxLogs: DEFAULT_MAX_LOGS,
  };
}

/**
 * Attach scroll listener
 */
export function attachScrollListener(state: LogViewerState): () => void {
  if (!state.scrollContainer) {
    return () => {};
  }

  const listener = () => handleScroll(state);
  state.scrollContainer.addEventListener("scroll", listener);

  return () => {
    if (state.scrollContainer) {
      state.scrollContainer.removeEventListener("scroll", listener);
    }
  };
}

/**
 * Jump to bottom button component
 */
export function createJumpToBottomButton(state: LogViewerState): {
  element: HTMLElement;
  update: () => void;
  cleanup: () => void;
} {
  const button = document.createElement("button");
  button.className = "log-viewer-jump-to-bottom";
  button.innerHTML = "↓ Jump to Bottom";
  button.style.display = "none";

  const update = () => {
    if (state.userScrolledUp && !state.autoScrollEnabled) {
      button.style.display = "block";
    } else {
      button.style.display = "none";
    }
  };

  const handleClick = () => {
    if (state.scrollContainer) {
      state.autoScrollEnabled = true;
      state.userScrolledUp = false;
      scrollToBottom(state.scrollContainer, true);
      update();
    }
  };

  button.addEventListener("click", handleClick);

  const cleanup = () => {
    button.removeEventListener("click", handleClick);
    button.remove();
  };

  return { element: button, update, cleanup };
}

/**
 * Auto-scroll toggle button component
 */
export function createAutoScrollToggle(state: LogViewerState): {
  element: HTMLElement;
  update: () => void;
  cleanup: () => void;
} {
  const container = document.createElement("div");
  container.className = "log-viewer-autoscroll-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "log-autoscroll-toggle";
  checkbox.checked = state.autoScrollEnabled;

  const label = document.createElement("label");
  label.htmlFor = "log-autoscroll-toggle";
  label.textContent = "Auto-scroll";

  container.appendChild(checkbox);
  container.appendChild(label);

  const update = () => {
    checkbox.checked = state.autoScrollEnabled;
  };

  const handleChange = () => {
    toggleAutoScroll(state);
    update();
  };

  checkbox.addEventListener("change", handleChange);

  const cleanup = () => {
    checkbox.removeEventListener("change", handleChange);
    container.remove();
  };

  return { element: container, update, cleanup };
}

/**
 * Filter logs by query
 */
export function filterLogs(logs: string[], query: string): string[] {
  if (!query.trim()) {
    return logs;
  }

  const lowerQuery = query.toLowerCase();
  return logs.filter((log) => log.toLowerCase().includes(lowerQuery));
}

/**
 * Export logs to file
 */
export function exportLogs(logs: string[], filename = "logs.txt") {
  const content = logs.join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
