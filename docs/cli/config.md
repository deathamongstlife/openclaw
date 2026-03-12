---
summary: "CLI reference for `jarvis config` (get/set/unset/file/validate)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `jarvis config`

Config helpers: get/set/unset/validate values by path and print the active
config file. Run without a subcommand to open
the configure wizard (same as `jarvis configure`).

## Examples

```bash
jarvis config file
jarvis config get browser.executablePath
jarvis config set browser.executablePath "/usr/bin/google-chrome"
jarvis config set agents.defaults.heartbeat.every "2h"
jarvis config set agents.list[0].tools.exec.node "node-id-or-name"
jarvis config unset tools.web.search.apiKey
jarvis config validate
jarvis config validate --json
```

## Paths

Paths use dot or bracket notation:

```bash
jarvis config get agents.defaults.workspace
jarvis config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
jarvis config get agents.list
jarvis config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--strict-json` to require JSON5 parsing. `--json` remains supported as a legacy alias.

```bash
jarvis config set agents.defaults.heartbeat.every "0m"
jarvis config set gateway.port 19001 --strict-json
jarvis config set channels.whatsapp.groups '["*"]' --strict-json
```

## Subcommands

- `config file`: Print the active config file path (resolved from `OPENCLAW_CONFIG_PATH` or default location).

Restart the gateway after edits.

## Validate

Validate the current config against the active schema without starting the
gateway.

```bash
jarvis config validate
jarvis config validate --json
```
