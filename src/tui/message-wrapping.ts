/**
 * TUI message wrapping and text overflow handling
 * Addresses issue #43288 - TUI crashes on very long messages
 */

export type WrapOptions = {
  maxWidth: number;
  breakLongWords: boolean;
  preserveWhitespace: boolean;
  ellipsis: string;
};

const DEFAULT_WRAP_OPTIONS: WrapOptions = {
  maxWidth: 80,
  breakLongWords: true,
  preserveWhitespace: false,
  ellipsis: "...",
};

/**
 * Wrap text to fit within terminal width
 */
export function wrapText(text: string, options: Partial<WrapOptions> = {}): string[] {
  const opts = { ...DEFAULT_WRAP_OPTIONS, ...options };
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = opts.preserveWhitespace
      ? paragraph.split(/(\s+)/)
      : paragraph.split(/\s+/);

    let currentLine = "";

    for (const word of words) {
      if (!word) continue;

      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const lineLength = getVisualLength(testLine);

      if (lineLength <= opts.maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }

        if (getVisualLength(word) > opts.maxWidth) {
          if (opts.breakLongWords) {
            lines.push(...breakLongWord(word, opts.maxWidth));
            currentLine = "";
          } else {
            currentLine = truncateToWidth(word, opts.maxWidth, opts.ellipsis);
          }
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Get visual length of text (accounting for ANSI codes)
 */
export function getVisualLength(text: string): number {
  return stripAnsi(text).length;
}

/**
 * Strip ANSI escape codes from text
 */
export function stripAnsi(text: string): string {
  const ansiRegex = /\x1b\[[0-9;]*m/g;
  return text.replace(ansiRegex, "");
}

/**
 * Break a long word into chunks
 */
function breakLongWord(word: string, maxWidth: number): string[] {
  const chunks: string[] = [];
  let remaining = word;

  while (remaining.length > maxWidth) {
    chunks.push(remaining.slice(0, maxWidth));
    remaining = remaining.slice(maxWidth);
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

/**
 * Truncate text to fit within width
 */
export function truncateToWidth(
  text: string,
  maxWidth: number,
  ellipsis = "...",
): string {
  if (getVisualLength(text) <= maxWidth) {
    return text;
  }

  const ellipsisLength = ellipsis.length;
  const targetLength = maxWidth - ellipsisLength;

  if (targetLength <= 0) {
    return ellipsis.slice(0, maxWidth);
  }

  return text.slice(0, targetLength) + ellipsis;
}

/**
 * Pad text to fit exact width
 */
export function padToWidth(text: string, width: number, padChar = " "): string {
  const visualLength = getVisualLength(text);
  if (visualLength >= width) {
    return text;
  }

  const padding = padChar.repeat(width - visualLength);
  return text + padding;
}

/**
 * Sanitize text for terminal display
 */
export function sanitizeForTerminal(text: string): string {
  return (
    text
      .replace(/\x00/g, "")
      .replace(/\x08/g, "")
      .replace(/\x0c/g, "")
      .replace(/\x1b\[/g, "\\e[")
      .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
  );
}

/**
 * Format message for TUI display
 */
export function formatMessageForTUI(
  message: string,
  terminalWidth: number,
  maxLines = 1000,
): string[] {
  const sanitized = sanitizeForTerminal(message);
  const wrapped = wrapText(sanitized, {
    maxWidth: terminalWidth - 2,
    breakLongWords: true,
    preserveWhitespace: false,
  });

  if (wrapped.length > maxLines) {
    const truncatedLines = wrapped.slice(0, maxLines);
    truncatedLines.push(`... (truncated ${wrapped.length - maxLines} lines)`);
    return truncatedLines;
  }

  return wrapped;
}

/**
 * Create a box around text
 */
export function createTextBox(lines: string[], width: number): string[] {
  const boxed: string[] = [];
  const topBorder = "┌" + "─".repeat(width - 2) + "┐";
  const bottomBorder = "└" + "─".repeat(width - 2) + "┘";

  boxed.push(topBorder);

  for (const line of lines) {
    const padded = padToWidth(line, width - 4);
    boxed.push(`│ ${padded} │`);
  }

  boxed.push(bottomBorder);

  return boxed;
}

/**
 * Highlight search matches in text
 */
export function highlightMatches(text: string, query: string): string {
  if (!query) {
    return text;
  }

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return text.replace(regex, (match) => `\x1b[7m${match}\x1b[0m`);
}

/**
 * Truncate message for preview
 */
export function truncateMessage(message: string, maxLength = 100): string {
  const singleLine = message.replace(/\n/g, " ").trim();
  return truncateToWidth(singleLine, maxLength);
}
