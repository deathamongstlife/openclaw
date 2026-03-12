/**
 * Keyboard shortcuts for settings panel
 * Addresses issue #43179 - Settings panel doesn't save on Enter key
 */

export type KeyboardShortcutHandler = (event: KeyboardEvent) => boolean | void;

export type KeyboardShortcutMap = {
  [key: string]: KeyboardShortcutHandler;
};

/**
 * Settings panel keyboard shortcuts
 */
export const SETTINGS_SHORTCUTS: KeyboardShortcutMap = {
  "Enter": (event) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Enter or Cmd+Enter to save
      return true;
    }
    // Regular Enter in text input fields
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" && target.getAttribute("type") !== "textarea") {
      return true;
    }
    return false;
  },
  "Escape": () => {
    // ESC to cancel/close
    return true;
  },
  "s": (event) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+S or Cmd+S to save
      event.preventDefault();
      return true;
    }
    return false;
  },
};

/**
 * Handle keyboard shortcuts
 */
export function handleKeyboardShortcut(
  event: KeyboardEvent,
  shortcuts: KeyboardShortcutMap,
): string | null {
  const key = event.key;
  const handler = shortcuts[key];

  if (handler) {
    const result = handler(event);
    if (result) {
      return key;
    }
  }

  return null;
}

/**
 * Attach keyboard shortcuts to element
 */
export function attachKeyboardShortcuts(
  element: HTMLElement,
  shortcuts: KeyboardShortcutMap,
  handlers: {
    onSave?: () => void;
    onCancel?: () => void;
  },
) {
  const listener = (event: KeyboardEvent) => {
    const triggeredKey = handleKeyboardShortcut(event, shortcuts);

    if (triggeredKey) {
      event.preventDefault();
      event.stopPropagation();

      switch (triggeredKey) {
        case "Enter":
        case "s":
          handlers.onSave?.();
          break;
        case "Escape":
          handlers.onCancel?.();
          break;
      }
    }
  };

  element.addEventListener("keydown", listener);

  return () => {
    element.removeEventListener("keydown", listener);
  };
}

/**
 * Get keyboard shortcut hint text
 */
export function getShortcutHint(platform: "mac" | "windows" | "linux"): {
  save: string;
  cancel: string;
} {
  const modifier = platform === "mac" ? "⌘" : "Ctrl";

  return {
    save: `${modifier}+Enter or ${modifier}+S`,
    cancel: "ESC",
  };
}

/**
 * Detect platform for keyboard shortcuts
 */
export function detectPlatform(): "mac" | "windows" | "linux" {
  if (typeof navigator === "undefined") {
    return "linux";
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";

  if (userAgent.includes("mac") || platform.includes("mac")) {
    return "mac";
  }

  if (userAgent.includes("win") || platform.includes("win")) {
    return "windows";
  }

  return "linux";
}

/**
 * Settings panel with keyboard shortcuts component
 */
export function createSettingsPanelWithShortcuts(params: {
  onSave: () => void;
  onCancel: () => void;
  element: HTMLElement;
}): () => void {
  const platform = detectPlatform();
  const hints = getShortcutHint(platform);

  // Add hint text to UI
  const hintElement = document.createElement("div");
  hintElement.className = "keyboard-shortcuts-hint";
  hintElement.innerHTML = `
    <span class="hint-label">Keyboard shortcuts:</span>
    <span class="hint-item"><kbd>${hints.save}</kbd> to save</span>
    <span class="hint-item"><kbd>${hints.cancel}</kbd> to cancel</span>
  `;
  params.element.appendChild(hintElement);

  // Attach keyboard listeners
  const cleanup = attachKeyboardShortcuts(params.element, SETTINGS_SHORTCUTS, {
    onSave: params.onSave,
    onCancel: params.onCancel,
  });

  return () => {
    cleanup();
    hintElement.remove();
  };
}

/**
 * Auto-save settings on change with debounce
 */
export function createAutoSaveSettings(params: {
  onSave: () => Promise<void>;
  debounceMs?: number;
}): {
  markDirty: () => void;
  flush: () => Promise<void>;
  cleanup: () => void;
} {
  const debounceMs = params.debounceMs ?? 1000;
  let timeoutId: number | null = null;
  let pending = false;

  const save = async () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (pending) {
      return;
    }

    pending = true;
    try {
      await params.onSave();
    } finally {
      pending = false;
    }
  };

  const markDirty = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      void save();
    }, debounceMs);
  };

  const flush = async () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    await save();
  };

  const cleanup = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { markDirty, flush, cleanup };
}
