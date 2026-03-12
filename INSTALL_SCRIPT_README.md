# Jarvis Install Script

The Jarvis installer has been successfully rebranded from Jarvis.

## Location

`install.sh` - Main installer script for macOS and Linux

## Usage

### Standard Installation

```bash
curl -fsSL https://jarvis.ai/install.sh | bash
```

### Installation with Options

```bash
# Skip onboarding
curl -fsSL https://jarvis.ai/install.sh | bash -s -- --no-onboard

# Install in non-interactive mode
curl -fsSL https://jarvis.ai/install.sh | NO_PROMPT=1 bash

# Custom install location
curl -fsSL https://jarvis.ai/install.sh | bash -s -- --prefix=/custom/path
```

## Features

The install script includes:

✅ **Multi-platform support**: macOS and Linux
✅ **Automatic dependency detection**: Node.js, npm, pnpm
✅ **Interactive UI**: Uses `gum` for better UX when available
✅ **Secure downloads**: HTTPS-only with TLS 1.2+ and checksum verification
✅ **Non-interactive mode**: CI/CD friendly with `NO_PROMPT=1`
✅ **Fallback options**: Works with curl or wget
✅ **Colorized output**: Beautiful terminal UI with Jarvis branding

## Deployment

To make this work with `curl -fsSL https://jarvis.ai/install.sh | bash`:

### Option 1: Static Web Server

Host `install.sh` at the root of your `jarvis.ai` domain:

```
https://jarvis.ai/install.sh
```

### Option 2: Redirect Setup

If you already have a website at `jarvis.ai`, configure your web server to serve `install.sh`:

**Nginx example:**

```nginx
location = /install.sh {
    alias /path/to/jarvis/install.sh;
    add_header Content-Type text/plain;
}
```

**Apache example:**

```apache
Alias /install.sh /path/to/jarvis/install.sh
<Files "install.sh">
    ForceType text/plain
</Files>
```

### Option 3: GitHub Pages / CDN

You can also serve it from:

- GitHub Pages: `https://deathamongstlife.github.io/jarvis/install.sh`
- CDN (jsDelivr): `https://cdn.jsdelivr.net/gh/deathamongstlife/jarvis@main/install.sh`

Then redirect `jarvis.ai/install.sh` to the CDN URL.

## Testing Locally

```bash
# Test the script locally before deployment
bash install.sh

# Test with dry-run (if supported)
bash install.sh --help
```

## Changes from Jarvis

All references have been updated:

- ✅ `jarvis.ai` → `jarvis.ai`
- ✅ `Jarvis` → `Jarvis`
- ✅ `jarvis` → `jarvis`
- ✅ `JARVIS_*` → `JARVIS_*` (environment variables)
- ✅ Default tagline: "All your chats, one Jarvis."

## Next Steps

1. **Set up jarvis.ai domain** - Purchase and configure DNS
2. **Deploy install.sh** - Upload to web server or CDN
3. **Test the installer** - Run `curl -fsSL https://jarvis.ai/install.sh | bash` on a clean system
4. **Update documentation** - Reference the new install command in your README and docs

## Security Notes

The installer:

- ✅ Uses HTTPS with TLS 1.2+ enforcement
- ✅ Verifies checksums for downloaded binaries
- ✅ Has retry logic with exponential backoff
- ✅ Cleans up temporary files on exit
- ✅ Validates downloaded content before execution

## Maintenance

When updating the installer:

1. Test thoroughly on fresh macOS and Linux systems
2. Update version numbers if needed
3. Verify all URLs point to `jarvis.ai`
4. Check that all rebranding is consistent
