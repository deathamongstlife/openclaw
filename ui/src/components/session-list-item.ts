import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

export type SessionListItemData = {
  key: string;
  channel: string;
  user: string;
  lastActivity: number;
  messageCount: number;
  agentId?: string;
};

@customElement("session-list-item")
export class SessionListItem extends LitElement {
  @property({ type: Object }) session: SessionListItemData | null = null;
  @property({ type: Boolean }) selected = false;

  static styles = css`
    :host {
      display: block;
    }

    .item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .item:hover {
      background-color: var(--color-surface-hover);
    }

    .item.selected {
      background-color: var(--color-primary-light);
      border-left: 3px solid var(--color-primary);
    }

    .channel-badge {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
      background: var(--color-primary);
      color: white;
      text-transform: uppercase;
    }

    .content {
      flex: 1;
      min-width: 0;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .user {
      font-weight: 600;
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .channel-name {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      padding: 0.125rem 0.5rem;
      background: var(--color-surface);
      border-radius: 4px;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .timestamp {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
  `;

  private formatTimestamp(ms: number): string {
    const now = Date.now();
    const diff = now - ms;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return "Just now";
  }

  private handleClick() {
    this.dispatchEvent(
      new CustomEvent("session-select", {
        detail: { session: this.session },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.session) {
      return html``;
    }

    const channelInitial = this.session.channel.charAt(0).toUpperCase();

    return html`
      <div
        class="item ${this.selected ? "selected" : ""}"
        @click=${this.handleClick}
        role="button"
        tabindex="0"
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.handleClick();
          }
        }}
      >
        <div class="channel-badge">${channelInitial}</div>
        <div class="content">
          <div class="header">
            <span class="user">${this.session.user || "Unknown"}</span>
            <span class="channel-name">${this.session.channel}</span>
          </div>
          <div class="meta">
            <span class="meta-item">
              📨 ${this.session.messageCount} msg${this.session.messageCount !== 1 ? "s" : ""}
            </span>
            ${this.session.agentId ? html`
              <span class="meta-item">🤖 ${this.session.agentId.slice(0, 8)}</span>
            ` : ""}
          </div>
        </div>
        <div class="timestamp">${this.formatTimestamp(this.session.lastActivity)}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "session-list-item": SessionListItem;
  }
}
