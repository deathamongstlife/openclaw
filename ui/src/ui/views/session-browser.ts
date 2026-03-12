import { html } from "lit";
import type { AppViewState } from "../app-view-state.js";
import "../../components/session-list-item.js";
import type { SessionListItemData } from "../../components/session-list-item.js";

export type SessionDetailData = {
  key: string;
  channel: string;
  user: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
  metadata?: Record<string, unknown>;
};

export type SessionBrowserState = {
  loading: boolean;
  error: string | null;
  sessions: SessionListItemData[];
  selectedSession: SessionDetailData | null;
  searchQuery: string;
  filterChannel: string;
  filterStartDate: string;
  filterEndDate: string;
  exportFormat: "json" | "markdown" | "html";
};

const sessionBrowserState: SessionBrowserState = {
  loading: false,
  error: null,
  sessions: [],
  selectedSession: null,
  searchQuery: "",
  filterChannel: "all",
  filterStartDate: "",
  filterEndDate: "",
  exportFormat: "json",
};

async function loadSessions(host: AppViewState) {
  sessionBrowserState.loading = true;
  sessionBrowserState.error = null;
  host.requestUpdate();

  try {
    const params = new URLSearchParams();
    if (sessionBrowserState.searchQuery) {
      params.set("q", sessionBrowserState.searchQuery);
    }
    if (sessionBrowserState.filterChannel !== "all") {
      params.set("channel", sessionBrowserState.filterChannel);
    }
    if (sessionBrowserState.filterStartDate) {
      params.set("start", sessionBrowserState.filterStartDate);
    }
    if (sessionBrowserState.filterEndDate) {
      params.set("end", sessionBrowserState.filterEndDate);
    }

    const response = await fetch(`/api/v1/sessions?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to load sessions: ${response.statusText}`);
    }

    const data = await response.json();
    sessionBrowserState.sessions = data.sessions || [];
  } catch (err) {
    sessionBrowserState.error = String(err);
  } finally {
    sessionBrowserState.loading = false;
    host.requestUpdate();
  }
}

async function loadSessionDetail(host: AppViewState, sessionKey: string) {
  try {
    const response = await fetch(`/api/v1/sessions/${encodeURIComponent(sessionKey)}`);
    if (!response.ok) {
      throw new Error(`Failed to load session: ${response.statusText}`);
    }

    const data = await response.json();
    sessionBrowserState.selectedSession = data;
    host.requestUpdate();
  } catch (err) {
    sessionBrowserState.error = String(err);
    host.requestUpdate();
  }
}

async function exportSession(sessionKey: string, format: "json" | "markdown" | "html") {
  try {
    const response = await fetch(`/api/v1/sessions/${encodeURIComponent(sessionKey)}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${sessionKey}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(`Export failed: ${String(err)}`);
  }
}

function renderSessionTimeline(session: SessionDetailData) {
  return html`
    <div style="padding: 1rem; max-height: 600px; overflow-y: auto;">
      ${session.messages.map(
        (msg) => html`
          <div
            style="
              display: flex;
              gap: 1rem;
              margin-bottom: 1rem;
              padding: 1rem;
              background: ${msg.role === "user" ? "#f0f9ff" : "#f9fafb"};
              border-left: 3px solid ${msg.role === "user" ? "#3b82f6" : "#10b981"};
              border-radius: 4px;
            "
          >
            <div style="flex-shrink: 0; font-weight: 600; text-transform: capitalize;">
              ${msg.role === "user" ? "👤" : "🤖"} ${msg.role}:
            </div>
            <div style="flex: 1;">
              <div style="white-space: pre-wrap; word-break: break-word;">
                ${msg.content}
              </div>
              <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--color-text-secondary);">
                ${new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        `
      )}
    </div>
  `;
}

export function renderSessionBrowser(host: AppViewState) {
  if (sessionBrowserState.sessions.length === 0 && !sessionBrowserState.loading) {
    setTimeout(() => loadSessions(host), 100);
  }

  return html`
    <div style="display: flex; height: calc(100vh - 60px);">
      <div style="width: 400px; border-right: 1px solid var(--color-border); display: flex; flex-direction: column;">
        <div style="padding: 1rem; border-bottom: 1px solid var(--color-border);">
          <h2 style="margin: 0 0 1rem 0; font-size: 1.25rem;">Sessions</h2>

          <input
            type="text"
            placeholder="Search sessions..."
            .value=${sessionBrowserState.searchQuery}
            @input=${(e: Event) => {
              sessionBrowserState.searchQuery = (e.target as HTMLInputElement).value;
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") {
                loadSessions(host);
              }
            }}
            style="
              width: 100%;
              padding: 0.5rem;
              border: 1px solid var(--color-border);
              border-radius: 4px;
              margin-bottom: 0.5rem;
            "
          />

          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
            <input
              type="date"
              .value=${sessionBrowserState.filterStartDate}
              @input=${(e: Event) => {
                sessionBrowserState.filterStartDate = (e.target as HTMLInputElement).value;
              }}
              style="flex: 1; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 4px;"
            />
            <input
              type="date"
              .value=${sessionBrowserState.filterEndDate}
              @input=${(e: Event) => {
                sessionBrowserState.filterEndDate = (e.target as HTMLInputElement).value;
              }}
              style="flex: 1; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 4px;"
            />
          </div>

          <select
            .value=${sessionBrowserState.filterChannel}
            @change=${(e: Event) => {
              sessionBrowserState.filterChannel = (e.target as HTMLSelectElement).value;
            }}
            style="
              width: 100%;
              padding: 0.5rem;
              border: 1px solid var(--color-border);
              border-radius: 4px;
              margin-bottom: 0.5rem;
            "
          >
            <option value="all">All Channels</option>
            <option value="telegram">Telegram</option>
            <option value="discord">Discord</option>
            <option value="slack">Slack</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="signal">Signal</option>
          </select>

          <button
            @click=${() => loadSessions(host)}
            ?disabled=${sessionBrowserState.loading}
            style="
              width: 100%;
              padding: 0.5rem;
              background: var(--color-primary);
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 500;
            "
          >
            ${sessionBrowserState.loading ? "Searching..." : "Search"}
          </button>
        </div>

        <div style="flex: 1; overflow-y: auto;">
          ${sessionBrowserState.loading ? html`
            <div style="padding: 2rem; text-align: center; color: var(--color-text-secondary);">
              Loading sessions...
            </div>
          ` : sessionBrowserState.error ? html`
            <div style="padding: 1rem; background: #fef2f2; border: 1px solid #ef4444; margin: 1rem;">
              <strong>Error:</strong> ${sessionBrowserState.error}
            </div>
          ` : sessionBrowserState.sessions.length === 0 ? html`
            <div style="padding: 2rem; text-align: center; color: var(--color-text-secondary);">
              No sessions found
            </div>
          ` : html`
            ${sessionBrowserState.sessions.map(
              (session) => html`
                <session-list-item
                  .session=${session}
                  ?selected=${sessionBrowserState.selectedSession?.key === session.key}
                  @session-select=${() => loadSessionDetail(host, session.key)}
                ></session-list-item>
              `
            )}
          `}
        </div>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        ${sessionBrowserState.selectedSession ? html`
          <div style="padding: 1rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">
                Session: ${sessionBrowserState.selectedSession.key}
              </h2>
              <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
                Channel: ${sessionBrowserState.selectedSession.channel} |
                User: ${sessionBrowserState.selectedSession.user} |
                Messages: ${sessionBrowserState.selectedSession.messages.length}
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <select
                .value=${sessionBrowserState.exportFormat}
                @change=${(e: Event) => {
                  sessionBrowserState.exportFormat = (e.target as HTMLSelectElement).value as any;
                }}
                style="padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 4px;"
              >
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
              <button
                @click=${() =>
                  exportSession(
                    sessionBrowserState.selectedSession!.key,
                    sessionBrowserState.exportFormat
                  )}
                style="
                  padding: 0.5rem 1rem;
                  background: var(--color-primary);
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                "
              >
                📥 Export
              </button>
            </div>
          </div>

          <div style="flex: 1; overflow-y: auto;">
            ${renderSessionTimeline(sessionBrowserState.selectedSession)}
          </div>
        ` : html`
          <div style="display: flex; align-items: center; justify-center; height: 100%; color: var(--color-text-secondary);">
            Select a session to view details
          </div>
        `}
      </div>
    </div>
  `;
}
