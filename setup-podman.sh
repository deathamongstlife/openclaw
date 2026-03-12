#!/usr/bin/env bash
# One-time host setup for rootless Jarvis in Podman: creates the jarvis
# user, builds the image, loads it into that user's Podman store, and installs
# the launch script. Run from repo root with sudo capability.
#
# Usage: ./setup-podman.sh [--quadlet|--container]
#   --quadlet   Install systemd Quadlet so the container runs as a user service
#   --container Only install user + image + launch script; you start the container manually (default)
#   Or set JARVIS_PODMAN_QUADLET=1 (or 0) to choose without a flag.
#
# After this, start the gateway manually:
#   ./scripts/run-jarvis-podman.sh launch
#   ./scripts/run-jarvis-podman.sh launch setup   # onboarding wizard
# Or as the jarvis user: sudo -u jarvis /home/jarvis/run-jarvis-podman.sh
# If you used --quadlet, you can also: sudo systemctl --machine jarvis@ --user start jarvis.service
set -euo pipefail

JARVIS_USER="${JARVIS_PODMAN_USER:-jarvis}"
REPO_PATH="${JARVIS_REPO_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
RUN_SCRIPT_SRC="$REPO_PATH/scripts/run-jarvis-podman.sh"
QUADLET_TEMPLATE="$REPO_PATH/scripts/podman/jarvis.container.in"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing dependency: $1" >&2
    exit 1
  fi
}

is_writable_dir() {
  local dir="$1"
  [[ -n "$dir" && -d "$dir" && ! -L "$dir" && -w "$dir" && -x "$dir" ]]
}

is_safe_tmp_base() {
  local dir="$1"
  local mode=""
  local owner=""
  is_writable_dir "$dir" || return 1
  mode="$(stat -Lc '%a' "$dir" 2>/dev/null || true)"
  if [[ -n "$mode" ]]; then
    local perm=$((8#$mode))
    if (( (perm & 0022) != 0 && (perm & 01000) == 0 )); then
      return 1
    fi
  fi
  if is_root; then
    owner="$(stat -Lc '%u' "$dir" 2>/dev/null || true)"
    if [[ -n "$owner" && "$owner" != "0" ]]; then
      return 1
    fi
  fi
  return 0
}

resolve_image_tmp_dir() {
  if ! is_root && is_safe_tmp_base "${TMPDIR:-}"; then
    printf '%s' "$TMPDIR"
    return 0
  fi
  if is_safe_tmp_base "/var/tmp"; then
    printf '%s' "/var/tmp"
    return 0
  fi
  if is_safe_tmp_base "/tmp"; then
    printf '%s' "/tmp"
    return 0
  fi
  printf '%s' "/tmp"
}

is_root() { [[ "$(id -u)" -eq 0 ]]; }

run_root() {
  if is_root; then
    "$@"
  else
    sudo "$@"
  fi
}

run_as_user() {
  # When switching users, the caller's cwd may be inaccessible to the target
  # user (e.g. a private home dir). Wrap in a subshell that cd's to a
  # world-traversable directory so sudo/runuser don't fail with "cannot chdir".
  # TODO: replace with fully rootless podman build to eliminate the need for
  # user-switching entirely.
  local user="$1"
  shift
  if command -v sudo >/dev/null 2>&1; then
    ( cd /tmp 2>/dev/null || cd /; sudo -u "$user" "$@" )
  elif is_root && command -v runuser >/dev/null 2>&1; then
    ( cd /tmp 2>/dev/null || cd /; runuser -u "$user" -- "$@" )
  else
    echo "Need sudo (or root+runuser) to run commands as $user." >&2
    exit 1
  fi
}

run_as_jarvis() {
  # Avoid root writes into $JARVIS_HOME (symlink/hardlink/TOCTOU footguns).
  # Anything under the target user's home should be created/modified as that user.
  run_as_user "$JARVIS_USER" env HOME="$JARVIS_HOME" "$@"
}

escape_sed_replacement_pipe_delim() {
  # Escape replacement metacharacters for sed "s|...|...|g" replacement text.
  printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'
}

# Quadlet: opt-in via --quadlet or JARVIS_PODMAN_QUADLET=1
INSTALL_QUADLET=false
for arg in "$@"; do
  case "$arg" in
    --quadlet)   INSTALL_QUADLET=true ;;
    --container) INSTALL_QUADLET=false ;;
  esac
done
if [[ -n "${JARVIS_PODMAN_QUADLET:-}" ]]; then
  case "${JARVIS_PODMAN_QUADLET,,}" in
    1|yes|true)  INSTALL_QUADLET=true ;;
    0|no|false) INSTALL_QUADLET=false ;;
  esac
fi

require_cmd podman
if ! is_root; then
  require_cmd sudo
fi
if [[ ! -f "$REPO_PATH/Dockerfile" ]]; then
  echo "Dockerfile not found at $REPO_PATH. Set JARVIS_REPO_PATH to the repo root." >&2
  exit 1
fi
if [[ ! -f "$RUN_SCRIPT_SRC" ]]; then
  echo "Launch script not found at $RUN_SCRIPT_SRC." >&2
  exit 1
fi

generate_token_hex_32() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
    return 0
  fi
  if command -v od >/dev/null 2>&1; then
    # 32 random bytes -> 64 lowercase hex chars
    od -An -N32 -tx1 /dev/urandom | tr -d " \n"
    return 0
  fi
  echo "Missing dependency: need openssl or python3 (or od) to generate JARVIS_GATEWAY_TOKEN." >&2
  exit 1
}

user_exists() {
  local user="$1"
  if command -v getent >/dev/null 2>&1; then
    getent passwd "$user" >/dev/null 2>&1 && return 0
  fi
  id -u "$user" >/dev/null 2>&1
}

resolve_user_home() {
  local user="$1"
  local home=""
  if command -v getent >/dev/null 2>&1; then
    home="$(getent passwd "$user" 2>/dev/null | cut -d: -f6 || true)"
  fi
  if [[ -z "$home" && -f /etc/passwd ]]; then
    home="$(awk -F: -v u="$user" '$1==u {print $6}' /etc/passwd 2>/dev/null || true)"
  fi
  if [[ -z "$home" ]]; then
    home="/home/$user"
  fi
  printf '%s' "$home"
}

resolve_nologin_shell() {
  for cand in /usr/sbin/nologin /sbin/nologin /usr/bin/nologin /bin/false; do
    if [[ -x "$cand" ]]; then
      printf '%s' "$cand"
      return 0
    fi
  done
  printf '%s' "/usr/sbin/nologin"
}

# Create jarvis user (non-login, with home) if missing
if ! user_exists "$JARVIS_USER"; then
  NOLOGIN_SHELL="$(resolve_nologin_shell)"
  echo "Creating user $JARVIS_USER ($NOLOGIN_SHELL, with home)..."
  if command -v useradd >/dev/null 2>&1; then
    run_root useradd -m -s "$NOLOGIN_SHELL" "$JARVIS_USER"
  elif command -v adduser >/dev/null 2>&1; then
    # Debian/Ubuntu: adduser supports --disabled-password/--gecos. Busybox adduser differs.
    run_root adduser --disabled-password --gecos "" --shell "$NOLOGIN_SHELL" "$JARVIS_USER"
  else
    echo "Neither useradd nor adduser found, cannot create user $JARVIS_USER." >&2
    exit 1
  fi
else
  echo "User $JARVIS_USER already exists."
fi

JARVIS_HOME="$(resolve_user_home "$JARVIS_USER")"
JARVIS_UID="$(id -u "$JARVIS_USER" 2>/dev/null || true)"
JARVIS_CONFIG="$JARVIS_HOME/.jarvis"
LAUNCH_SCRIPT_DST="$JARVIS_HOME/run-jarvis-podman.sh"

# Prefer systemd user services (Quadlet) for production. Enable lingering early so rootless Podman can run
# without an interactive login.
if command -v loginctl &>/dev/null; then
  run_root loginctl enable-linger "$JARVIS_USER" 2>/dev/null || true
fi
if [[ -n "${JARVIS_UID:-}" && -d /run/user ]] && command -v systemctl &>/dev/null; then
  run_root systemctl start "user@${JARVIS_UID}.service" 2>/dev/null || true
fi

# Rootless Podman needs subuid/subgid for the run user
if ! grep -q "^${JARVIS_USER}:" /etc/subuid 2>/dev/null; then
  echo "Warning: $JARVIS_USER has no subuid range. Rootless Podman may fail." >&2
  echo "  Add a line to /etc/subuid and /etc/subgid, e.g.: $JARVIS_USER:100000:65536" >&2
fi

echo "Creating $JARVIS_CONFIG and workspace..."
run_as_jarvis mkdir -p "$JARVIS_CONFIG/workspace"
run_as_jarvis chmod 700 "$JARVIS_CONFIG" "$JARVIS_CONFIG/workspace" 2>/dev/null || true

ENV_FILE="$JARVIS_CONFIG/.env"
if run_as_jarvis test -f "$ENV_FILE"; then
  if ! run_as_jarvis grep -q '^JARVIS_GATEWAY_TOKEN=' "$ENV_FILE" 2>/dev/null; then
    TOKEN="$(generate_token_hex_32)"
    printf 'JARVIS_GATEWAY_TOKEN=%s\n' "$TOKEN" | run_as_jarvis tee -a "$ENV_FILE" >/dev/null
    echo "Added JARVIS_GATEWAY_TOKEN to $ENV_FILE."
  fi
  run_as_jarvis chmod 600 "$ENV_FILE" 2>/dev/null || true
else
  TOKEN="$(generate_token_hex_32)"
  printf 'JARVIS_GATEWAY_TOKEN=%s\n' "$TOKEN" | run_as_jarvis tee "$ENV_FILE" >/dev/null
  run_as_jarvis chmod 600 "$ENV_FILE" 2>/dev/null || true
  echo "Created $ENV_FILE with new token."
fi

# The gateway refuses to start unless gateway.mode=local is set in config.
# Make first-run non-interactive; users can run the wizard later to configure channels/providers.
JARVIS_JSON="$JARVIS_CONFIG/jarvis.json"
if ! run_as_jarvis test -f "$JARVIS_JSON"; then
  printf '%s\n' '{ gateway: { mode: "local" } }' | run_as_jarvis tee "$JARVIS_JSON" >/dev/null
  run_as_jarvis chmod 600 "$JARVIS_JSON" 2>/dev/null || true
  echo "Created $JARVIS_JSON (minimal gateway.mode=local)."
fi

echo "Building image from $REPO_PATH..."
BUILD_ARGS=()
[[ -n "${JARVIS_DOCKER_APT_PACKAGES:-}" ]] && BUILD_ARGS+=(--build-arg "JARVIS_DOCKER_APT_PACKAGES=${JARVIS_DOCKER_APT_PACKAGES}")
[[ -n "${JARVIS_EXTENSIONS:-}" ]] && BUILD_ARGS+=(--build-arg "JARVIS_EXTENSIONS=${JARVIS_EXTENSIONS}")
podman build ${BUILD_ARGS[@]+"${BUILD_ARGS[@]}"} -t jarvis:local -f "$REPO_PATH/Dockerfile" "$REPO_PATH"

echo "Loading image into $JARVIS_USER's Podman store..."
TMP_IMAGE_DIR="$(resolve_image_tmp_dir)"
echo "Using temporary image dir: $TMP_IMAGE_DIR"
TMP_STAGE_DIR="$(mktemp -d -p "$TMP_IMAGE_DIR" jarvis-image.XXXXXX)"
TMP_IMAGE="$TMP_STAGE_DIR/image.tar"
chmod 700 "$TMP_STAGE_DIR"
trap 'rm -rf "$TMP_STAGE_DIR"' EXIT
podman save jarvis:local -o "$TMP_IMAGE"
chmod 600 "$TMP_IMAGE"
# Stream the image into the target user's podman load so private temp directories
# do not need to be traversable by $JARVIS_USER.
cat "$TMP_IMAGE" | run_as_user "$JARVIS_USER" env HOME="$JARVIS_HOME" podman load
rm -rf "$TMP_STAGE_DIR"
trap - EXIT

echo "Copying launch script to $LAUNCH_SCRIPT_DST..."
run_root cat "$RUN_SCRIPT_SRC" | run_as_jarvis tee "$LAUNCH_SCRIPT_DST" >/dev/null
run_as_jarvis chmod 755 "$LAUNCH_SCRIPT_DST"

# Optionally install systemd quadlet for jarvis user (rootless Podman + systemd)
QUADLET_DIR="$JARVIS_HOME/.config/containers/systemd"
if [[ "$INSTALL_QUADLET" == true && -f "$QUADLET_TEMPLATE" ]]; then
  echo "Installing systemd quadlet for $JARVIS_USER..."
  run_as_jarvis mkdir -p "$QUADLET_DIR"
  JARVIS_HOME_SED="$(escape_sed_replacement_pipe_delim "$JARVIS_HOME")"
  sed "s|{{JARVIS_HOME}}|$JARVIS_HOME_SED|g" "$QUADLET_TEMPLATE" | run_as_jarvis tee "$QUADLET_DIR/jarvis.container" >/dev/null
  run_as_jarvis chmod 700 "$JARVIS_HOME/.config" "$JARVIS_HOME/.config/containers" "$QUADLET_DIR" 2>/dev/null || true
  run_as_jarvis chmod 600 "$QUADLET_DIR/jarvis.container" 2>/dev/null || true
  if command -v systemctl &>/dev/null; then
    run_root systemctl --machine "${JARVIS_USER}@" --user daemon-reload 2>/dev/null || true
    run_root systemctl --machine "${JARVIS_USER}@" --user enable jarvis.service 2>/dev/null || true
    run_root systemctl --machine "${JARVIS_USER}@" --user start jarvis.service 2>/dev/null || true
  fi
fi

echo ""
echo "Setup complete. Start the gateway:"
echo "  $RUN_SCRIPT_SRC launch"
echo "  $RUN_SCRIPT_SRC launch setup   # onboarding wizard"
echo "Or as $JARVIS_USER (e.g. from cron):"
echo "  sudo -u $JARVIS_USER $LAUNCH_SCRIPT_DST"
echo "  sudo -u $JARVIS_USER $LAUNCH_SCRIPT_DST setup"
if [[ "$INSTALL_QUADLET" == true ]]; then
  echo "Or use systemd (quadlet):"
  echo "  sudo systemctl --machine ${JARVIS_USER}@ --user start jarvis.service"
  echo "  sudo systemctl --machine ${JARVIS_USER}@ --user status jarvis.service"
else
  echo "To install systemd quadlet later: $0 --quadlet"
fi
