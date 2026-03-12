/**
 * Terminal input handling with proper key navigation
 * Addresses issue #43256 - TUI navigation keys conflict with shell
 */

export type KeySequence = {
  name: string;
  sequence: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
};

export type KeyHandler = (key: KeySequence) => boolean | void;

/**
 * Parse key sequence from input
 */
export function parseKeySequence(data: Buffer | string): KeySequence | null {
  const input = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (input.length === 0) {
    return null;
  }

  const firstByte = input[0];

  if (firstByte === 0x1b) {
    if (input.length === 1) {
      return { name: "escape", sequence: "\x1b", ctrl: false, meta: false, shift: false };
    }

    if (input.length === 2) {
      return {
        name: String.fromCharCode(input[1]),
        sequence: input.toString(),
        ctrl: false,
        meta: true,
        shift: false,
      };
    }

    if (input[1] === 0x5b) {
      return parseAnsiSequence(input);
    }

    if (input[1] === 0x4f) {
      return parseApplicationModeSequence(input);
    }
  }

  if (firstByte < 0x20) {
    return parseControlSequence(firstByte);
  }

  return {
    name: input.toString("utf8"),
    sequence: input.toString("utf8"),
    ctrl: false,
    meta: false,
    shift: false,
  };
}

/**
 * Parse ANSI escape sequence
 */
function parseAnsiSequence(input: Buffer): KeySequence | null {
  if (input.length < 3) {
    return null;
  }

  const code = input[2];

  const keyMap: Record<number, string> = {
    0x41: "up",
    0x42: "down",
    0x43: "right",
    0x44: "left",
    0x48: "home",
    0x46: "end",
  };

  const name = keyMap[code];
  if (name) {
    return {
      name,
      sequence: input.toString(),
      ctrl: false,
      meta: false,
      shift: false,
    };
  }

  if (input.length >= 4 && input[3] === 0x7e) {
    const extendedKeyMap: Record<number, string> = {
      0x31: "home",
      0x32: "insert",
      0x33: "delete",
      0x34: "end",
      0x35: "pageup",
      0x36: "pagedown",
    };

    const extName = extendedKeyMap[code];
    if (extName) {
      return {
        name: extName,
        sequence: input.toString(),
        ctrl: false,
        meta: false,
        shift: false,
      };
    }
  }

  return {
    name: "unknown",
    sequence: input.toString(),
    ctrl: false,
    meta: false,
    shift: false,
  };
}

/**
 * Parse application mode escape sequence
 */
function parseApplicationModeSequence(input: Buffer): KeySequence | null {
  if (input.length < 3) {
    return null;
  }

  const code = input[2];

  const keyMap: Record<number, string> = {
    0x50: "f1",
    0x51: "f2",
    0x52: "f3",
    0x53: "f4",
  };

  const name = keyMap[code] || "unknown";

  return {
    name,
    sequence: input.toString(),
    ctrl: false,
    meta: false,
    shift: false,
  };
}

/**
 * Parse control key sequence
 */
function parseControlSequence(byte: number): KeySequence {
  const ctrlKeyMap: Record<number, string> = {
    0x01: "a",
    0x02: "b",
    0x03: "c",
    0x04: "d",
    0x05: "e",
    0x06: "f",
    0x07: "g",
    0x08: "backspace",
    0x09: "tab",
    0x0a: "enter",
    0x0b: "k",
    0x0c: "l",
    0x0d: "return",
    0x0e: "n",
    0x0f: "o",
    0x10: "p",
    0x11: "q",
    0x12: "r",
    0x13: "s",
    0x14: "t",
    0x15: "u",
    0x16: "v",
    0x17: "w",
    0x18: "x",
    0x19: "y",
    0x1a: "z",
    0x7f: "backspace",
  };

  const name = ctrlKeyMap[byte] || "unknown";

  return {
    name,
    sequence: String.fromCharCode(byte),
    ctrl: byte >= 0x01 && byte <= 0x1a,
    meta: false,
    shift: false,
  };
}

/**
 * Terminal input handler
 */
export class TerminalInputHandler {
  private handlers: Map<string, KeyHandler> = new Map();
  private buffer: Buffer[] = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(private readonly flushTimeout = 50) {}

  /**
   * Register key handler
   */
  on(keyName: string, handler: KeyHandler): void {
    this.handlers.set(keyName, handler);
  }

  /**
   * Unregister key handler
   */
  off(keyName: string): void {
    this.handlers.delete(keyName);
  }

  /**
   * Handle raw input data
   */
  handleInput(data: Buffer | string): void {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
    this.buffer.push(input);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.flushTimeout);
  }

  /**
   * Flush input buffer
   */
  private flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const combined = Buffer.concat(this.buffer);
    this.buffer = [];

    const key = parseKeySequence(combined);
    if (key) {
      this.handleKey(key);
    }
  }

  /**
   * Handle parsed key sequence
   */
  private handleKey(key: KeySequence): void {
    const handler = this.handlers.get(key.name);
    if (handler) {
      const handled = handler(key);
      if (handled !== false) {
        return;
      }
    }

    const defaultHandler = this.handlers.get("*");
    if (defaultHandler) {
      defaultHandler(key);
    }
  }

  /**
   * Enable raw mode
   */
  static enableRawMode(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
    }
  }

  /**
   * Disable raw mode
   */
  static disableRawMode(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }

  /**
   * Clean up
   */
  cleanup(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.buffer = [];
    this.handlers.clear();
  }
}

/**
 * Create TUI navigation key bindings
 */
export function createNavigationBindings(): Map<string, KeyHandler> {
  const bindings = new Map<string, KeyHandler>();

  bindings.set("up", () => {
    // Navigate up
    return true;
  });

  bindings.set("down", () => {
    // Navigate down
    return true;
  });

  bindings.set("left", () => {
    // Navigate left
    return true;
  });

  bindings.set("right", () => {
    // Navigate right
    return true;
  });

  bindings.set("pageup", () => {
    // Page up
    return true;
  });

  bindings.set("pagedown", () => {
    // Page down
    return true;
  });

  bindings.set("home", () => {
    // Go to start
    return true;
  });

  bindings.set("end", () => {
    // Go to end
    return true;
  });

  return bindings;
}
