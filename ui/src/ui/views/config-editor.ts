import { html } from "lit";
import type { AppViewState } from "../app-view-state.js";

export type ConfigEditorState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  config: Record<string, unknown> | null;
  originalConfig: Record<string, unknown> | null;
  isDirty: boolean;
  validationErrors: Record<string, string>;
  showDiff: boolean;
};

const configEditorState: ConfigEditorState = {
  loading: false,
  saving: false,
  error: null,
  config: null,
  originalConfig: null,
  isDirty: false,
  validationErrors: {},
  showDiff: false,
};

async function loadConfig(host: AppViewState) {
  configEditorState.loading = true;
  configEditorState.error = null;
  host.requestUpdate();

  try {
    const response = await fetch("/api/v1/config");
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }

    const data = await response.json();
    configEditorState.config = data.config || {};
    configEditorState.originalConfig = JSON.parse(JSON.stringify(data.config || {}));
    configEditorState.isDirty = false;
  } catch (err) {
    configEditorState.error = String(err);
  } finally {
    configEditorState.loading = false;
    host.requestUpdate();
  }
}

async function saveConfig(host: AppViewState) {
  if (!configEditorState.config) {
    return;
  }

  configEditorState.saving = true;
  configEditorState.error = null;
  host.requestUpdate();

  try {
    const response = await fetch("/api/v1/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: configEditorState.config }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Save failed: ${response.statusText}`);
    }

    configEditorState.originalConfig = JSON.parse(JSON.stringify(configEditorState.config));
    configEditorState.isDirty = false;
    alert("Configuration saved successfully!");
  } catch (err) {
    configEditorState.error = String(err);
  } finally {
    configEditorState.saving = false;
    host.requestUpdate();
  }
}

function resetConfig(host: AppViewState) {
  if (!configEditorState.originalConfig) {
    return;
  }

  if (configEditorState.isDirty) {
    if (!confirm("Discard unsaved changes?")) {
      return;
    }
  }

  configEditorState.config = JSON.parse(JSON.stringify(configEditorState.originalConfig));
  configEditorState.isDirty = false;
  host.requestUpdate();
}

function updateConfigValue(host: AppViewState, path: string, value: unknown) {
  if (!configEditorState.config) {
    return;
  }

  const parts = path.split(".");
  let current: any = configEditorState.config;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
  configEditorState.isDirty = true;
  host.requestUpdate();
}

function renderConfigDiff() {
  if (!configEditorState.config || !configEditorState.originalConfig) {
    return html``;
  }

  const current = JSON.stringify(configEditorState.config, null, 2);
  const original = JSON.stringify(configEditorState.originalConfig, null, 2);

  return html`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
      <div>
        <h4 style="margin: 0 0 0.5rem 0;">Original</h4>
        <pre style="background: #f9fafb; padding: 1rem; border-radius: 4px; overflow: auto; max-height: 400px;">${original}</pre>
      </div>
      <div>
        <h4 style="margin: 0 0 0.5rem 0;">Current</h4>
        <pre style="background: #f0f9ff; padding: 1rem; border-radius: 4px; overflow: auto; max-height: 400px;">${current}</pre>
      </div>
    </div>
  `;
}

function renderConfigFields(host: AppViewState, config: Record<string, unknown>, prefix = "") {
  return Object.entries(config).map(([key, value]) => {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return html`
        <div style="margin-left: 1rem; margin-top: 1rem;">
          <h4 style="margin: 0 0 0.5rem 0; color: var(--color-text-secondary);">${key}</h4>
          ${renderConfigFields(host, value as Record<string, unknown>, fullPath)}
        </div>
      `;
    }

    return html`
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.25rem; font-weight: 500;">
          ${key}
        </label>
        ${typeof value === "boolean" ? html`
          <input
            type="checkbox"
            .checked=${value}
            @change=${(e: Event) => {
              updateConfigValue(host, fullPath, (e.target as HTMLInputElement).checked);
            }}
          />
        ` : typeof value === "number" ? html`
          <input
            type="number"
            .value=${String(value)}
            @input=${(e: Event) => {
              const num = Number((e.target as HTMLInputElement).value);
              updateConfigValue(host, fullPath, num);
            }}
            style="width: 100%; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 4px;"
          />
        ` : html`
          <input
            type="text"
            .value=${String(value || "")}
            @input=${(e: Event) => {
              updateConfigValue(host, fullPath, (e.target as HTMLInputElement).value);
            }}
            style="width: 100%; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 4px;"
          />
        `}
      </div>
    `;
  });
}

export function renderConfigEditor(host: AppViewState) {
  if (!configEditorState.config && !configEditorState.loading) {
    setTimeout(() => loadConfig(host), 100);
  }

  return html`
    <div style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="margin: 0 0 0.5rem 0; font-size: 1.75rem;">Configuration Editor</h1>
          <p style="margin: 0; color: var(--color-text-secondary);">
            Edit your OpenClaw gateway configuration
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button
            @click=${() => { configEditorState.showDiff = !configEditorState.showDiff; host.requestUpdate(); }}
            style="padding: 0.5rem 1rem; border: 1px solid var(--color-border); border-radius: 4px; background: white; cursor: pointer;"
          >
            ${configEditorState.showDiff ? "Hide" : "Show"} Diff
          </button>
          <button
            @click=${() => resetConfig(host)}
            ?disabled=${!configEditorState.isDirty || configEditorState.loading}
            style="padding: 0.5rem 1rem; border: 1px solid var(--color-border); border-radius: 4px; background: white; cursor: pointer;"
          >
            Reset
          </button>
          <button
            @click=${() => saveConfig(host)}
            ?disabled=${!configEditorState.isDirty || configEditorState.saving}
            style="padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;"
          >
            ${configEditorState.saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      ${configEditorState.error ? html`
        <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 4px; padding: 1rem; margin-bottom: 1rem;">
          <strong>Error:</strong> ${configEditorState.error}
        </div>
      ` : ""}

      ${configEditorState.isDirty ? html`
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 1rem; margin-bottom: 1rem;">
          You have unsaved changes. Click <strong>Save Configuration</strong> to apply them.
        </div>
      ` : ""}

      ${configEditorState.loading ? html`
        <div style="padding: 3rem; text-align: center; color: var(--color-text-secondary);">
          Loading configuration...
        </div>
      ` : configEditorState.config ? html`
        ${configEditorState.showDiff ? renderConfigDiff() : ""}

        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1.5rem; margin-top: 1rem;">
          ${renderConfigFields(host, configEditorState.config)}
        </div>
      ` : html`
        <div style="padding: 3rem; text-align: center; color: var(--color-text-secondary);">
          No configuration loaded
        </div>
      `}
    </div>
  `;
}
