#!/usr/bin/env bash
#
# Jarvis Local Models Installation Script
# Automatically installs Ollama and sets up local AI models
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OLLAMA_URL="https://ollama.com"
DEFAULT_MODEL="llama3.2:3b"
JARVIS_CONFIG="${HOME}/.jarvis/config.json"

# Helper functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# Detect OS and architecture
detect_platform() {
  OS="$(uname -s)"
  ARCH="$(uname -m)"

  case "$OS" in
    Linux*)   PLATFORM="linux" ;;
    Darwin*)  PLATFORM="macos" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
    *)        PLATFORM="unknown" ;;
  esac

  log_info "Detected platform: $PLATFORM ($ARCH)"
}

# Check if Ollama is installed
check_ollama_installed() {
  if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>&1 | grep -oP 'version is \K[\d.]+' || echo "unknown")
    log_success "Ollama is already installed (version: $OLLAMA_VERSION)"
    return 0
  else
    log_warning "Ollama is not installed"
    return 1
  fi
}

# Install Ollama
install_ollama() {
  log_info "Installing Ollama..."

  case "$PLATFORM" in
    linux)
      log_info "Installing Ollama on Linux..."
      if curl -fsSL https://ollama.com/install.sh | sh; then
        log_success "Ollama installed successfully"
      else
        log_error "Failed to install Ollama"
        exit 1
      fi
      ;;

    macos)
      log_info "Installing Ollama on macOS..."
      if command -v brew &> /dev/null; then
        if brew install ollama; then
          log_success "Ollama installed via Homebrew"
        else
          log_error "Failed to install Ollama via Homebrew"
          log_info "Please download manually from: ${OLLAMA_URL}/download"
          exit 1
        fi
      else
        log_warning "Homebrew not found"
        log_info "Please download Ollama manually from: ${OLLAMA_URL}/download"
        log_info "Or install Homebrew first: https://brew.sh"
        exit 1
      fi
      ;;

    windows)
      log_warning "Windows detected"
      log_info "Please download and install Ollama manually from: ${OLLAMA_URL}/download"
      log_info "After installation, run this script again"
      exit 1
      ;;

    *)
      log_error "Unsupported platform: $PLATFORM"
      log_info "Please install Ollama manually from: ${OLLAMA_URL}/download"
      exit 1
      ;;
  esac
}

# Start Ollama server
start_ollama() {
  log_info "Starting Ollama server..."

  # Check if already running
  if curl -s http://localhost:11434/api/tags &> /dev/null; then
    log_success "Ollama server is already running"
    return 0
  fi

  # Start server in background
  if [[ "$PLATFORM" == "windows" ]]; then
    start ollama serve &
  else
    nohup ollama serve > /dev/null 2>&1 &
  fi

  # Wait for server to start (max 10 seconds)
  log_info "Waiting for server to start..."
  for i in {1..10}; do
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
      log_success "Ollama server started successfully"
      return 0
    fi
    sleep 1
  done

  log_error "Failed to start Ollama server"
  log_info "Try starting manually with: ollama serve"
  exit 1
}

# Detect system resources
detect_resources() {
  log_info "Detecting system resources..."

  # Get total RAM (in GB)
  if [[ "$PLATFORM" == "macos" ]]; then
    TOTAL_RAM=$(sysctl hw.memsize | awk '{print int($2/1024/1024/1024)}')
  elif [[ "$PLATFORM" == "linux" ]]; then
    TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
  else
    TOTAL_RAM=8 # Default fallback
  fi

  log_info "Total RAM: ${TOTAL_RAM}GB"

  # Detect GPU
  HAS_GPU=false
  GPU_NAME="None"

  if [[ "$PLATFORM" == "macos" ]]; then
    if system_profiler SPDisplaysDataType 2>/dev/null | grep -q "Metal"; then
      HAS_GPU=true
      GPU_NAME=$(system_profiler SPDisplaysDataType | grep "Chipset Model" | head -1 | cut -d: -f2 | xargs)
    fi
  elif [[ "$PLATFORM" == "linux" ]]; then
    if command -v nvidia-smi &> /dev/null; then
      HAS_GPU=true
      GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
    fi
  fi

  if [ "$HAS_GPU" = true ]; then
    log_success "GPU detected: $GPU_NAME"
  else
    log_info "No GPU detected (CPU-only mode)"
  fi
}

# Recommend a model based on resources
recommend_model() {
  if [ "$TOTAL_RAM" -ge 48 ]; then
    RECOMMENDED_MODEL="llama3.3:70b"
    log_info "Recommended model: Llama 3.3 70B (high-end system)"
  elif [ "$TOTAL_RAM" -ge 24 ]; then
    RECOMMENDED_MODEL="qwen2.5:32b"
    log_info "Recommended model: Qwen 2.5 32B (mid-range system)"
  elif [ "$TOTAL_RAM" -ge 12 ]; then
    RECOMMENDED_MODEL="phi4"
    log_info "Recommended model: Phi-4 14B (balanced system)"
  else
    RECOMMENDED_MODEL="llama3.2:3b"
    log_info "Recommended model: Llama 3.2 3B (efficient system)"
  fi
}

# Pull a model
pull_model() {
  local model=$1
  log_info "Downloading model: $model"
  log_warning "This may take a while depending on your internet connection..."

  if ollama pull "$model"; then
    log_success "Model $model downloaded successfully"
  else
    log_error "Failed to download model: $model"
    exit 1
  fi
}

# Test model
test_model() {
  local model=$1
  log_info "Testing model: $model"

  local response=$(ollama run "$model" "Say hello!" --verbose=false 2>/dev/null || echo "")

  if [ -n "$response" ]; then
    log_success "Model $model is working correctly"
    return 0
  else
    log_error "Model $model test failed"
    return 1
  fi
}

# Configure Jarvis
configure_jarvis() {
  local model=$1
  log_info "Configuring Jarvis to use $model..."

  # Check if Jarvis is installed
  if ! command -v jarvis &> /dev/null; then
    log_warning "Jarvis CLI not found"
    log_info "Install Jarvis first: npm install -g jarvis"
    log_info "Then configure manually with: jarvis config set agents.defaults.model ollama/$model"
    return 0
  fi

  # Create config directory if it doesn't exist
  mkdir -p "$(dirname "$JARVIS_CONFIG")"

  # Set default model
  if jarvis config set agents.defaults.model "ollama/$model" 2>/dev/null; then
    log_success "Jarvis configured to use $model"
  else
    log_warning "Failed to configure Jarvis automatically"
    log_info "Configure manually with: jarvis config set agents.defaults.model ollama/$model"
  fi
}

# List installed models
list_models() {
  log_info "Installed models:"
  if command -v ollama &> /dev/null; then
    ollama list
  else
    log_warning "Ollama not available"
  fi
}

# Main installation flow
main() {
  echo ""
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║         Jarvis Local Models Installer                  ║"
  echo "║         Automated AI Model Setup                         ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo ""

  # Parse arguments
  INTERACTIVE=true
  SKIP_PULL=false
  CUSTOM_MODEL=""

  while [[ $# -gt 0 ]]; do
    case $1 in
      --non-interactive|-y)
        INTERACTIVE=false
        shift
        ;;
      --model|-m)
        CUSTOM_MODEL="$2"
        shift 2
        ;;
      --skip-pull)
        SKIP_PULL=true
        shift
        ;;
      --list)
        list_models
        exit 0
        ;;
      --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  -y, --non-interactive  Run without prompts"
        echo "  -m, --model MODEL      Install specific model"
        echo "  --skip-pull            Skip model download"
        echo "  --list                 List installed models"
        echo "  -h, --help             Show this help"
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        exit 1
        ;;
    esac
  done

  # Step 1: Detect platform
  detect_platform

  # Step 2: Check/Install Ollama
  if ! check_ollama_installed; then
    if [ "$INTERACTIVE" = true ]; then
      read -p "Install Ollama? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Installation cancelled"
        exit 0
      fi
    fi
    install_ollama
  fi

  # Step 3: Start Ollama server
  start_ollama

  # Step 4: Detect resources
  detect_resources

  # Step 5: Recommend model
  if [ -n "$CUSTOM_MODEL" ]; then
    RECOMMENDED_MODEL="$CUSTOM_MODEL"
    log_info "Using specified model: $RECOMMENDED_MODEL"
  else
    recommend_model
  fi

  # Step 6: Pull model
  if [ "$SKIP_PULL" = false ]; then
    if [ "$INTERACTIVE" = true ]; then
      read -p "Download $RECOMMENDED_MODEL? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Skipping model download"
        MODEL_PULLED=false
      else
        pull_model "$RECOMMENDED_MODEL"
        MODEL_PULLED=true
      fi
    else
      pull_model "$RECOMMENDED_MODEL"
      MODEL_PULLED=true
    fi
  else
    MODEL_PULLED=false
  fi

  # Step 7: Test model
  if [ "$MODEL_PULLED" = true ]; then
    test_model "$RECOMMENDED_MODEL"
  fi

  # Step 8: Configure Jarvis
  configure_jarvis "$RECOMMENDED_MODEL"

  # Step 9: Summary
  echo ""
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║                    Installation Complete                 ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo ""
  log_success "Local models are ready to use!"
  echo ""
  log_info "Quick Start:"
  echo "  • Use Jarvis CLI: jarvis message send 'Hello!'"
  echo "  • Pull more models: ollama pull llama3.3:70b"
  echo "  • List models: ollama list"
  echo "  • Start Ollama: ollama serve"
  echo ""
  log_info "Documentation: https://docs.jarvis.ai/local-models"
  echo ""
}

main "$@"
