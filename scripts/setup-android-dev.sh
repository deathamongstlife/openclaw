#!/usr/bin/env bash
set -euo pipefail

# Jarvis Android Development Environment Setup Script
# This script installs Rust, Android Studio, and configures Android SDK for building Jarvis Android app

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default versions
RUST_VERSION="stable"
ANDROID_SDK_VERSION="11076708" # Latest command-line tools
ANDROID_BUILD_TOOLS="34.0.0"
ANDROID_PLATFORM="34"
ANDROID_NDK_VERSION="26.1.10909125"

# Detect OS
OS="unknown"
case "$(uname -s)" in
    Linux*)     OS="linux";;
    Darwin*)    OS="macos";;
    CYGWIN*|MINGW*|MSYS*) OS="windows";;
esac

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Jarvis Android Development Environment Setup              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Detected OS: ${OS}${NC}"
echo ""

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Rust
install_rust() {
    log_info "Installing Rust..."

    if command_exists rustc; then
        CURRENT_VERSION=$(rustc --version)
        log_warning "Rust is already installed: $CURRENT_VERSION"
        read -p "Do you want to update Rust? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Updating Rust..."
            rustup update
            log_success "Rust updated successfully!"
        fi
    else
        log_info "Downloading and installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

        # Source cargo environment
        if [ -f "$HOME/.cargo/env" ]; then
            source "$HOME/.cargo/env"
        fi

        log_success "Rust installed successfully!"
    fi

    # Verify installation
    if command_exists rustc && command_exists cargo; then
        log_success "Rust version: $(rustc --version)"
        log_success "Cargo version: $(cargo --version)"
    else
        log_error "Rust installation failed!"
        exit 1
    fi
}

# Install Android Studio (Linux)
install_android_studio_linux() {
    log_info "Installing Android Studio for Linux..."

    ANDROID_STUDIO_DIR="$HOME/android-studio"

    if [ -d "$ANDROID_STUDIO_DIR" ]; then
        log_warning "Android Studio directory already exists at $ANDROID_STUDIO_DIR"
        read -p "Do you want to reinstall? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping Android Studio installation"
            return
        fi
        rm -rf "$ANDROID_STUDIO_DIR"
    fi

    log_info "Downloading Android Studio..."
    cd /tmp

    # Download latest stable release
    DOWNLOAD_URL="https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2024.1.1.13/android-studio-2024.1.1.13-linux.tar.gz"
    wget -O android-studio.tar.gz "$DOWNLOAD_URL"

    log_info "Extracting Android Studio..."
    tar -xzf android-studio.tar.gz -C "$HOME/"

    log_success "Android Studio installed to $ANDROID_STUDIO_DIR"
    log_info "To launch Android Studio, run: $ANDROID_STUDIO_DIR/bin/studio.sh"

    # Create desktop entry
    if [ -d "$HOME/.local/share/applications" ]; then
        cat > "$HOME/.local/share/applications/android-studio.desktop" <<EOF
[Desktop Entry]
Name=Android Studio
Comment=Android Development IDE
Exec=$ANDROID_STUDIO_DIR/bin/studio.sh
Icon=$ANDROID_STUDIO_DIR/bin/studio.png
Type=Application
Categories=Development;IDE;
Terminal=false
EOF
        log_success "Desktop entry created"
    fi

    rm -f /tmp/android-studio.tar.gz
}

# Install Android Studio (macOS)
install_android_studio_macos() {
    log_info "Installing Android Studio for macOS..."

    if [ -d "/Applications/Android Studio.app" ]; then
        log_warning "Android Studio is already installed at /Applications/Android Studio.app"
        read -p "Do you want to reinstall? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping Android Studio installation"
            return
        fi
    fi

    # Check if Homebrew is installed
    if command_exists brew; then
        log_info "Installing Android Studio via Homebrew..."
        brew install --cask android-studio
        log_success "Android Studio installed!"
    else
        log_info "Downloading Android Studio manually..."
        cd /tmp

        # Download for Apple Silicon or Intel
        if [[ $(uname -m) == 'arm64' ]]; then
            DOWNLOAD_URL="https://redirector.gvt1.com/edgedl/android/studio/install/2024.1.1.13/android-studio-2024.1.1.13-mac_arm.dmg"
        else
            DOWNLOAD_URL="https://redirector.gvt1.com/edgedl/android/studio/install/2024.1.1.13/android-studio-2024.1.1.13-mac.dmg"
        fi

        curl -L -o android-studio.dmg "$DOWNLOAD_URL"

        log_info "Mounting DMG and installing..."
        hdiutil attach android-studio.dmg
        cp -R "/Volumes/Android Studio/Android Studio.app" /Applications/
        hdiutil detach "/Volumes/Android Studio"

        rm -f /tmp/android-studio.dmg
        log_success "Android Studio installed to /Applications/Android Studio.app"
    fi
}

# Install Android SDK command-line tools
install_android_sdk() {
    log_info "Installing Android SDK command-line tools..."

    # Determine SDK location
    if [ "$OS" = "macos" ]; then
        ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
    else
        ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}"
    fi

    export ANDROID_SDK_ROOT
    export ANDROID_HOME="$ANDROID_SDK_ROOT"

    log_info "Android SDK will be installed to: $ANDROID_SDK_ROOT"

    mkdir -p "$ANDROID_SDK_ROOT"
    cd "$ANDROID_SDK_ROOT"

    # Download command-line tools
    if [ ! -d "$ANDROID_SDK_ROOT/cmdline-tools" ]; then
        log_info "Downloading Android SDK command-line tools..."

        if [ "$OS" = "linux" ]; then
            CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_SDK_VERSION}_latest.zip"
        elif [ "$OS" = "macos" ]; then
            CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-mac-${ANDROID_SDK_VERSION}_latest.zip"
        else
            log_error "Unsupported OS for automated SDK installation: $OS"
            exit 1
        fi

        wget -O cmdline-tools.zip "$CMDLINE_TOOLS_URL"
        unzip -q cmdline-tools.zip
        mkdir -p cmdline-tools/latest
        mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true
        rm -f cmdline-tools.zip

        log_success "Command-line tools downloaded"
    else
        log_warning "Command-line tools already exist"
    fi

    # Add to PATH
    export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

    # Accept licenses
    log_info "Accepting Android SDK licenses..."
    yes | sdkmanager --licenses >/dev/null 2>&1 || true

    # Install required SDK components
    log_info "Installing Android SDK Platform ${ANDROID_PLATFORM}..."
    sdkmanager "platform-tools" "platforms;android-${ANDROID_PLATFORM}" "build-tools;${ANDROID_BUILD_TOOLS}"

    log_info "Installing Android NDK ${ANDROID_NDK_VERSION}..."
    sdkmanager "ndk;${ANDROID_NDK_VERSION}"

    log_info "Installing system images and emulator..."
    sdkmanager "system-images;android-${ANDROID_PLATFORM};google_apis;x86_64" "emulator"

    log_success "Android SDK installed successfully!"

    # Display installed packages
    log_info "Installed SDK packages:"
    sdkmanager --list_installed | grep -E "(platform|build-tools|ndk)" || true
}

# Configure environment variables
configure_environment() {
    log_info "Configuring environment variables..."

    # Determine SDK location
    if [ "$OS" = "macos" ]; then
        ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
    else
        ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}"
    fi

    # Determine shell config file
    SHELL_CONFIG=""
    if [ -f "$HOME/.zshrc" ]; then
        SHELL_CONFIG="$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
        SHELL_CONFIG="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_CONFIG="$HOME/.bash_profile"
    fi

    if [ -z "$SHELL_CONFIG" ]; then
        log_warning "Could not determine shell config file"
        log_info "Please manually add these to your shell config:"
    else
        log_info "Adding environment variables to $SHELL_CONFIG"

        # Check if already configured
        if grep -q "ANDROID_SDK_ROOT" "$SHELL_CONFIG"; then
            log_warning "Android SDK variables already configured in $SHELL_CONFIG"
        else
            cat >> "$SHELL_CONFIG" <<EOF

# Android SDK configuration (added by Jarvis setup script)
export ANDROID_SDK_ROOT="$ANDROID_SDK_ROOT"
export ANDROID_HOME="\$ANDROID_SDK_ROOT"
export PATH="\$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:\$ANDROID_SDK_ROOT/platform-tools:\$ANDROID_SDK_ROOT/emulator:\$PATH"
EOF
            log_success "Environment variables added to $SHELL_CONFIG"
        fi
    fi

    # Display environment setup
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Add these to your shell configuration (if not done automatically):${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "export ANDROID_SDK_ROOT=\"$ANDROID_SDK_ROOT\""
    echo "export ANDROID_HOME=\"\$ANDROID_SDK_ROOT\""
    echo "export PATH=\"\$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:\$ANDROID_SDK_ROOT/platform-tools:\$ANDROID_SDK_ROOT/emulator:\$PATH\""
    echo ""
    echo -e "${YELLOW}Then reload your shell: source $SHELL_CONFIG${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Install Java (required for Android builds)
install_java() {
    log_info "Checking Java installation..."

    if command_exists java; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1)
        log_success "Java is already installed: $JAVA_VERSION"
        return
    fi

    log_info "Java not found. Installing Java..."

    if [ "$OS" = "linux" ]; then
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y openjdk-17-jdk
        elif command_exists dnf; then
            sudo dnf install -y java-17-openjdk-devel
        elif command_exists pacman; then
            sudo pacman -S --noconfirm jdk17-openjdk
        else
            log_error "Could not determine package manager. Please install Java 17 manually."
            return
        fi
    elif [ "$OS" = "macos" ]; then
        if command_exists brew; then
            brew install openjdk@17
            sudo ln -sfn "$(brew --prefix)/opt/openjdk@17/libexec/openjdk.jdk" "/Library/Java/JavaVirtualMachines/openjdk-17.jdk"
        else
            log_warning "Homebrew not found. Please install Java 17 manually from https://adoptium.net/"
            return
        fi
    fi

    if command_exists java; then
        log_success "Java installed successfully: $(java -version 2>&1 | head -n 1)"
    else
        log_error "Java installation failed"
    fi
}

# Install dependencies (Linux)
install_linux_dependencies() {
    log_info "Installing Linux dependencies..."

    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y \
            build-essential \
            curl \
            wget \
            unzip \
            git \
            libc6-dev \
            libstdc++6 \
            lib32z1 \
            lib32ncurses6 \
            lib32stdc++6
    elif command_exists dnf; then
        sudo dnf install -y \
            gcc \
            gcc-c++ \
            curl \
            wget \
            unzip \
            git \
            glibc-devel \
            libstdc++ \
            zlib \
            ncurses-compat-libs
    elif command_exists pacman; then
        sudo pacman -S --noconfirm \
            base-devel \
            curl \
            wget \
            unzip \
            git \
            lib32-gcc-libs \
            lib32-ncurses \
            lib32-zlib
    else
        log_warning "Could not determine package manager. Some dependencies may be missing."
    fi

    log_success "Linux dependencies installed"
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."
    echo ""

    local all_good=true

    # Check Rust
    if command_exists rustc && command_exists cargo; then
        log_success "✓ Rust: $(rustc --version)"
    else
        log_error "✗ Rust not found"
        all_good=false
    fi

    # Check Java
    if command_exists java; then
        log_success "✓ Java: $(java -version 2>&1 | head -n 1 | cut -d'"' -f2)"
    else
        log_warning "✗ Java not found (required for Android builds)"
        all_good=false
    fi

    # Check Android SDK
    if [ -n "${ANDROID_SDK_ROOT:-}" ] && [ -d "$ANDROID_SDK_ROOT" ]; then
        log_success "✓ Android SDK: $ANDROID_SDK_ROOT"
    else
        log_error "✗ Android SDK not found"
        all_good=false
    fi

    # Check ADB
    if command_exists adb; then
        log_success "✓ ADB: $(adb --version | head -n 1)"
    else
        log_warning "✗ ADB not found (add SDK platform-tools to PATH)"
    fi

    echo ""

    if [ "$all_good" = true ]; then
        log_success "All components installed successfully!"
    else
        log_warning "Some components are missing. Please review the output above."
    fi
}

# Build Jarvis Android app
build_jarvis_android() {
    log_info "Building Jarvis Android app..."

    cd "$PROJECT_ROOT/apps/android"

    if [ ! -f "gradlew" ]; then
        log_error "gradlew not found. Are you in the correct directory?"
        return 1
    fi

    log_info "Running gradle build..."
    ./gradlew :app:assembleDebug

    if [ $? -eq 0 ]; then
        APK_PATH="$PROJECT_ROOT/apps/android/app/build/outputs/apk/debug/app-debug.apk"
        if [ -f "$APK_PATH" ]; then
            log_success "APK built successfully!"
            log_success "APK location: $APK_PATH"

            # Copy to easier location
            cp "$APK_PATH" "$PROJECT_ROOT/jarvis-debug.apk"
            log_success "APK copied to: $PROJECT_ROOT/jarvis-debug.apk"
        else
            log_error "APK not found at expected location"
        fi
    else
        log_error "Build failed. Check the output above for errors."
    fi
}

# Install APK to connected device
install_to_device() {
    log_info "Installing APK to connected device..."

    if ! command_exists adb; then
        log_error "ADB not found. Cannot install to device."
        return 1
    fi

    # Check for connected devices
    DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device$" | wc -l)

    if [ "$DEVICE_COUNT" -eq 0 ]; then
        log_warning "No Android devices connected via USB"
        log_info "Connect your device and enable USB debugging, then try again"
        return 1
    fi

    log_success "Found $DEVICE_COUNT connected device(s)"

    cd "$PROJECT_ROOT/apps/android"
    ./gradlew :app:installDebug

    if [ $? -eq 0 ]; then
        log_success "App installed successfully!"
        log_info "Launch the app on your device to continue"
    else
        log_error "Installation failed"
    fi
}

# Main installation flow
main() {
    log_info "Starting Jarvis Android development environment setup..."
    echo ""

    # Install dependencies based on OS
    if [ "$OS" = "linux" ]; then
        install_linux_dependencies
    fi

    # Install Java
    install_java

    # Install Rust
    install_rust

    # Install Android Studio
    if [ "$OS" = "linux" ]; then
        install_android_studio_linux
    elif [ "$OS" = "macos" ]; then
        install_android_studio_macos
    else
        log_warning "Skipping Android Studio installation for $OS"
        log_info "Please download and install Android Studio manually from:"
        log_info "https://developer.android.com/studio"
    fi

    # Install Android SDK
    install_android_sdk

    # Configure environment
    configure_environment

    # Verify installation
    echo ""
    verify_installation

    # Offer to build
    echo ""
    read -p "Do you want to build the Jarvis Android app now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_jarvis_android

        echo ""
        read -p "Do you want to install to a connected Android device? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_to_device
        fi
    fi

    # Final instructions
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Setup Complete!                                              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Reload your shell: source ~/.zshrc (or ~/.bashrc)"
    echo "2. Open Android Studio: studio.sh (Linux) or launch from Applications (macOS)"
    echo "3. Open the project: File → Open → $PROJECT_ROOT/apps/android"
    echo "4. Build the app: ./gradlew :app:assembleDebug"
    echo "5. Install to device: ./gradlew :app:installDebug"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "  pnpm android:install  - Install debug APK to device"
    echo "  pnpm android:run      - Install and launch app"
    echo "  pnpm android:lint     - Run Kotlin linting"
    echo "  pnpm android:format   - Format Kotlin code"
    echo ""
    echo -e "${YELLOW}Documentation:${NC} $PROJECT_ROOT/apps/android/README.md"
    echo ""
}

# Run main function
main "$@"
