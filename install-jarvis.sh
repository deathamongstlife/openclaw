#!/bin/bash
#
# J.A.R.V.I.S. Quick Start Installation Script
# Automates the complete installation from source including Control UI and Android app
#
# Usage:
#   chmod +x install-jarvis.sh
#   ./install-jarvis.sh [--skip-android] [--skip-ui] [--dev-mode]
#
# Options:
#   --skip-android    Skip Android app build
#   --skip-ui         Skip Control UI build
#   --dev-mode        Install in development mode with hot reload
#   --help            Show this help message
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_ANDROID=false
SKIP_UI=false
DEV_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-android)
      SKIP_ANDROID=true
      shift
      ;;
    --skip-ui)
      SKIP_UI=true
      shift
      ;;
    --dev-mode)
      DEV_MODE=true
      shift
      ;;
    --help)
      head -n 15 "$0" | tail -n +2
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
  if command -v "$1" &> /dev/null; then
    log_success "$1 is installed"
    return 0
  else
    log_error "$1 is not installed"
    return 1
  fi
}

check_version() {
  local cmd=$1
  local version_cmd=$2
  local required=$3
  local current

  current=$($version_cmd 2>&1 || echo "0.0.0")
  log_info "$cmd version: $current (required: $required+)"
}

# Banner
echo -e "${BLUE}"
cat << 'EOF'
     ██╗ █████╗ ██████╗ ██╗   ██╗██╗███╗   ███╗
     ██║██╔══██╗██╔══██╗██║   ██║██║████╗ ████║
     ██║███████║██████╔╝██║   ██║██║██╔████╔██║
██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║██║╚██╔╝██║
╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║██║ ╚═╝ ██║
 ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚═╝     ╚═╝

Quick Start Installation Script
EOF
echo -e "${NC}"

log_info "Starting J.A.R.V.I.S. installation..."
echo ""

# Step 1: Check Prerequisites
log_info "Step 1/8: Checking prerequisites..."
echo ""

PREREQ_FAILED=false

# Check Node.js
if check_command "node"; then
  check_version "Node.js" "node --version" "22.12.0"
else
  PREREQ_FAILED=true
  log_error "Node.js 22.12.0+ is required"
  echo "  Install: https://nodejs.org/"
fi

# Check pnpm
if check_command "pnpm"; then
  check_version "pnpm" "pnpm --version" "10.23.0"
else
  PREREQ_FAILED=true
  log_error "pnpm 10.23.0+ is required"
  echo "  Install: npm install -g pnpm@10.23.0"
fi

# Check Git
if ! check_command "git"; then
  PREREQ_FAILED=true
  log_error "Git is required"
  echo "  Install: https://git-scm.com/downloads"
fi

# Android prerequisites (if not skipped)
if [ "$SKIP_ANDROID" = false ]; then
  if check_command "java"; then
    check_version "Java" "java -version 2>&1 | head -n 1" "17"
  else
    log_warning "Java not found - Android build will be skipped"
    SKIP_ANDROID=true
  fi

  if [ -z "$ANDROID_HOME" ]; then
    log_warning "ANDROID_HOME not set - Android build will be skipped"
    SKIP_ANDROID=true
  else
    log_success "ANDROID_HOME is set to $ANDROID_HOME"
  fi
fi

if [ "$PREREQ_FAILED" = true ]; then
  log_error "Prerequisites check failed. Please install missing dependencies."
  exit 1
fi

log_success "All prerequisites satisfied"
echo ""

# Step 2: Check if already in repo or need to clone
log_info "Step 2/8: Repository setup..."
echo ""

if [ -f "package.json" ] && grep -q '"name": "jarvis"' package.json 2>/dev/null; then
  log_success "Already in J.A.R.V.I.S. repository"
  REPO_DIR=$(pwd)
else
  log_info "Cloning J.A.R.V.I.S. repository from GitLab..."

  if [ -d "j.a.r.v.i.s" ]; then
    log_warning "Directory j.a.r.v.i.s already exists. Using existing directory."
    cd j.a.r.v.i.s
  else
    git clone https://git.allyapp.cc/everest/j.a.r.v.i.s.git
    cd j.a.r.v.i.s
  fi

  REPO_DIR=$(pwd)
  log_success "Repository ready at $REPO_DIR"
fi

echo ""

# Step 3: Install Dependencies
log_info "Step 3/8: Installing dependencies (this may take 5-10 minutes)..."
echo ""

pnpm install --frozen-lockfile || pnpm install

log_success "Dependencies installed"
echo ""

# Step 4: Build Core
log_info "Step 4/8: Building J.A.R.V.I.S. core..."
echo ""

pnpm build

log_success "Core build complete"
echo ""

# Step 5: Build Control UI
if [ "$SKIP_UI" = false ]; then
  log_info "Step 5/8: Building Control UI..."
  echo ""

  if [ "$DEV_MODE" = true ]; then
    log_info "Development mode: UI will run with hot reload"
    log_info "Run 'pnpm ui:dev' to start the UI dev server"
  else
    pnpm ui:build
    log_success "Control UI build complete"
  fi
else
  log_warning "Step 5/8: Skipping Control UI build"
fi

echo ""

# Step 6: Build Android App
if [ "$SKIP_ANDROID" = false ]; then
  log_info "Step 6/8: Building Android app..."
  echo ""

  cd "$REPO_DIR/apps/android"

  # Make gradlew executable
  chmod +x gradlew

  # Build debug APK
  log_info "Building debug APK..."
  ./gradlew :app:assembleDebug

  APK_PATH="$REPO_DIR/apps/android/app/build/outputs/apk/debug/app-debug.apk"

  if [ -f "$APK_PATH" ]; then
    log_success "Android APK built successfully"
    log_info "APK location: $APK_PATH"

    # Check if device is connected
    if command -v adb &> /dev/null; then
      DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)
      if [ "$DEVICES" -gt 0 ]; then
        log_info "Found $DEVICES connected Android device(s)"
        read -p "Install APK now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
          adb install -r "$APK_PATH"
          log_success "APK installed on device"
        fi
      else
        log_warning "No Android devices connected"
        log_info "Connect device and run: adb install $APK_PATH"
      fi
    fi
  else
    log_error "Android APK build failed"
  fi

  cd "$REPO_DIR"
else
  log_warning "Step 6/8: Skipping Android app build"
fi

echo ""

# Step 7: Configuration
log_info "Step 7/8: Configuration..."
echo ""

JARVIS_CONFIG_DIR="$HOME/.jarvis"

if [ -d "$JARVIS_CONFIG_DIR" ]; then
  log_success "Configuration directory exists: $JARVIS_CONFIG_DIR"
else
  log_info "Creating configuration directory: $JARVIS_CONFIG_DIR"
  mkdir -p "$JARVIS_CONFIG_DIR"
  log_success "Configuration directory created"
fi

if [ -f "$JARVIS_CONFIG_DIR/config.yaml" ]; then
  log_success "Configuration file exists"
else
  log_warning "No configuration file found"
  log_info "Run the onboarding wizard:"
  echo "  pnpm jarvis onboard --install-daemon"
  echo ""
  log_info "Or create config manually at: $JARVIS_CONFIG_DIR/config.yaml"
fi

echo ""

# Step 8: Verification
log_info "Step 8/8: Verifying installation..."
echo ""

# Check if built files exist
if [ -d "$REPO_DIR/dist" ] && [ "$(ls -A $REPO_DIR/dist 2>/dev/null)" ]; then
  log_success "Build artifacts found in dist/"
else
  log_error "Build artifacts missing - build may have failed"
fi

# Check if jarvis.mjs exists
if [ -f "$REPO_DIR/jarvis.mjs" ]; then
  log_success "jarvis.mjs binary found"
else
  log_error "jarvis.mjs binary missing"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Installation Complete! 🎉${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Next steps
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Run onboarding wizard:"
echo -e "   ${YELLOW}pnpm jarvis onboard --install-daemon${NC}"
echo ""
echo "2. Start the gateway:"
echo -e "   ${YELLOW}pnpm jarvis gateway --port 18789${NC}"
echo ""
echo "3. Access Control UI:"
echo -e "   ${YELLOW}http://localhost:18789${NC}"
echo ""

if [ "$SKIP_ANDROID" = false ] && [ -f "$APK_PATH" ]; then
  echo "4. Android APK location:"
  echo -e "   ${YELLOW}$APK_PATH${NC}"
  echo ""
fi

if [ "$DEV_MODE" = true ]; then
  echo "Development Mode Tips:"
  echo "  - Start UI dev server: pnpm ui:dev"
  echo "  - Start gateway in dev mode: pnpm gateway:dev"
  echo "  - Watch and rebuild: pnpm build --watch"
  echo ""
fi

echo "Essential Commands:"
echo "  pnpm jarvis status          - Check system status"
echo "  pnpm jarvis channels status - Check channel health"
echo "  pnpm jarvis doctor          - Run diagnostics"
echo "  pnpm test                   - Run tests"
echo ""

echo "Documentation:"
echo "  Installation Guide: INSTALL_FROM_SOURCE.md"
echo "  Discord Features:   skills/discord/NEW_FEATURES.md"
echo "  GitLab:            https://git.allyapp.cc/everest/j.a.r.v.i.s"
echo ""

echo -e "${GREEN}Welcome to J.A.R.V.I.S.! 🤖${NC}"
echo ""
