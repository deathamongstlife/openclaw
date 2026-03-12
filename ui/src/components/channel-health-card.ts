import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

export type ChannelHealthData = {
  name: string;
  status: "connected" | "disconnected" | "error" | "initializing";
  uptime: number;
  messageCount: number;
  errorCount: number;
  latency?: number;
  lastError?: string;
  accounts?: Array<{ id: string; name: string }>;
};

@customElement("channel-health-card")
export class ChannelHealthCard extends LitElement {
  @property({ type: Object }) channel: ChannelHealthData | null = null;
  @property({ type: Boolean }) expanded = false;

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      cursor: pointer;
      user-select: none;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.connected {
      background-color: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }

    .status-indicator.disconnected {
      background-color: #6b7280;
    }

    .status-indicator.error {
      background-color: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
    }

    .status-indicator.initializing {
      background-color: #f59e0b;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .channel-info {
      flex: 1;
      min-width: 0;
    }

    .channel-name {
      font-weight: 600;
      font-size: 1rem;
      color: var(--color-text-primary);
      margin-bottom: 0.25rem;
    }

    .channel-status {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      text-transform: capitalize;
    }

    .metrics {
      display: flex;
      gap: 1rem;
      align-items: center;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .expand-icon {
      flex-shrink: 0;
      transition: transform 0.2s ease;
      color: var(--color-text-secondary);
    }

    .expand-icon.expanded {
      transform: rotate(180deg);
    }

    .details {
      padding: 0 1rem 1rem 1rem;
      border-top: 1px solid var(--color-border);
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 500px;
      }
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }

    .detail-label {
      color: var(--color-text-secondary);
    }

    .detail-value {
      color: var(--color-text-primary);
      font-weight: 500;
    }

    .error-box {
      background: #fef2f2;
      border: 1px solid #ef4444;
      border-radius: 4px;
      padding: 0.5rem;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #991b1b;
    }

    .accounts-list {
      margin-top: 0.5rem;
    }

    .account-item {
      padding: 0.25rem 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.15s ease;
    }

    .btn:hover {
      background: var(--color-surface-hover);
    }

    .btn-primary {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .btn-primary:hover {
      opacity: 0.9;
    }
  `;

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  }

  private toggleExpanded() {
    this.expanded = !this.expanded;
  }

  private handleAction(action: "enable" | "disable" | "restart") {
    this.dispatchEvent(
      new CustomEvent("channel-action", {
        detail: { channel: this.channel?.name, action },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.channel) {
      return html``;
    }

    const uptimePercent = this.channel.uptime > 0 ? 99.5 : 0;

    return html`
      <div class="card">
        <div class="header" @click=${this.toggleExpanded}>
          <div class="status-indicator ${this.channel.status}"></div>
          <div class="channel-info">
            <div class="channel-name">${this.channel.name}</div>
            <div class="channel-status">${this.channel.status}</div>
          </div>
          <div class="metrics">
            <span title="Messages">📨 ${this.channel.messageCount}</span>
            ${this.channel.errorCount > 0 ? html`
              <span title="Errors" style="color: #ef4444">⚠️ ${this.channel.errorCount}</span>
            ` : ""}
            ${this.channel.latency !== undefined ? html`
              <span title="Latency">${this.channel.latency}ms</span>
            ` : ""}
          </div>
          <div class="expand-icon ${this.expanded ? "expanded" : ""}">▼</div>
        </div>

        ${this.expanded ? html`
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Uptime</span>
              <span class="detail-value">
                ${this.formatUptime(this.channel.uptime)} (${uptimePercent.toFixed(1)}%)
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Messages Delivered</span>
              <span class="detail-value">${this.channel.messageCount}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Error Count</span>
              <span class="detail-value">${this.channel.errorCount}</span>
            </div>
            ${this.channel.latency !== undefined ? html`
              <div class="detail-row">
                <span class="detail-label">Average Latency</span>
                <span class="detail-value">${this.channel.latency}ms</span>
              </div>
            ` : ""}

            ${this.channel.accounts && this.channel.accounts.length > 0 ? html`
              <div class="accounts-list">
                <div class="detail-label">Accounts:</div>
                ${this.channel.accounts.map(account => html`
                  <div class="account-item">• ${account.name || account.id}</div>
                `)}
              </div>
            ` : ""}

            ${this.channel.lastError ? html`
              <div class="error-box">
                <strong>Last Error:</strong><br>
                ${this.channel.lastError}
              </div>
            ` : ""}

            <div class="actions">
              ${this.channel.status === "connected" ? html`
                <button class="btn" @click=${() => this.handleAction("disable")}>
                  Disable
                </button>
                <button class="btn" @click=${() => this.handleAction("restart")}>
                  Restart
                </button>
              ` : html`
                <button class="btn btn-primary" @click=${() => this.handleAction("enable")}>
                  Enable
                </button>
              `}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "channel-health-card": ChannelHealthCard;
  }
}
