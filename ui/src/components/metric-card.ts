import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("metric-card")
export class MetricCard extends LitElement {
  @property({ type: String }) label = "";
  @property({ type: String }) value = "";
  @property({ type: String }) trend = "";
  @property({ type: String }) trendDirection: "up" | "down" | "neutral" = "neutral";
  @property({ type: String }) icon = "";
  @property({ type: String }) variant: "default" | "success" | "warning" | "error" = "default";

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.2s ease;
    }

    .card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .card.success {
      border-left: 4px solid #10b981;
    }

    .card.warning {
      border-left: 4px solid #f59e0b;
    }

    .card.error {
      border-left: 4px solid #ef4444;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .icon {
      font-size: 1.25rem;
      opacity: 0.7;
    }

    .label {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 0.5rem;
    }

    .trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .trend-icon {
      font-size: 1rem;
    }

    .trend.up .trend-icon {
      color: #10b981;
    }

    .trend.down .trend-icon {
      color: #ef4444;
    }

    .trend.neutral .trend-icon {
      color: var(--color-text-secondary);
    }
  `;

  render() {
    const trendIcon =
      this.trendDirection === "up" ? "▲" :
      this.trendDirection === "down" ? "▼" :
      "—";

    return html`
      <div class="card ${this.variant}">
        <div class="header">
          ${this.icon ? html`<span class="icon">${this.icon}</span>` : ""}
          <span class="label">${this.label}</span>
        </div>
        <div class="value">${this.value}</div>
        ${this.trend ? html`
          <div class="trend ${this.trendDirection}">
            <span class="trend-icon">${trendIcon}</span>
            <span>${this.trend}</span>
          </div>
        ` : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "metric-card": MetricCard;
  }
}
