#!/bin/bash
set -e

echo "🤖 Building Jarvis Documentation..."

# Configuration
DOCS_SOURCE="/opt/jarvis/docs"
DOCS_OUTPUT="/var/www/jarvis/docs-built"
TEMP_BUILD="/tmp/jarvis-docs-build"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Clean previous build
echo -e "${BLUE}Cleaning previous build...${NC}"
rm -rf "$TEMP_BUILD"
mkdir -p "$TEMP_BUILD"

# Copy all markdown files and assets
echo -e "${BLUE}Copying documentation files...${NC}"
cp -r "$DOCS_SOURCE"/* "$TEMP_BUILD/"

# Create assets directory
mkdir -p "$TEMP_BUILD/assets/css"
mkdir -p "$TEMP_BUILD/assets/js"

# Create Jarvis-themed CSS
cat > "$TEMP_BUILD/assets/css/jarvis.css" << 'EOF'
:root {
    --jarvis-primary: #00d4ff;
    --jarvis-secondary: #0066ff;
    --jarvis-accent: #00ffaa;
    --jarvis-dark: #0a0e27;
    --jarvis-darker: #050814;
    --jarvis-light: #e0f7ff;
    --jarvis-text: #ffffff;
    --jarvis-text-muted: #a0b5c7;
    --jarvis-border: #1a2847;
    --jarvis-glow: rgba(0, 212, 255, 0.3);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, var(--jarvis-darker) 0%, var(--jarvis-dark) 100%);
    color: var(--jarvis-text);
    line-height: 1.6;
    min-height: 100vh;
}

/* Animated background */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
        radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(0, 102, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(0, 255, 170, 0.05) 0%, transparent 50%);
    animation: pulse 15s ease-in-out infinite;
    z-index: -1;
}

@keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
}

/* Header */
header {
    background: rgba(10, 14, 39, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--jarvis-border);
    padding: 1rem 2rem;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 20px var(--jarvis-glow);
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: var(--jarvis-text);
}

.logo-icon {
    font-size: 2rem;
    animation: rotate 20s linear infinite;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--jarvis-primary), var(--jarvis-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
}

.nav-links a {
    color: var(--jarvis-text-muted);
    text-decoration: none;
    transition: all 0.3s;
    position: relative;
}

.nav-links a:hover {
    color: var(--jarvis-primary);
}

.nav-links a::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--jarvis-primary);
    transition: width 0.3s;
}

.nav-links a:hover::after {
    width: 100%;
}

/* Main Content */
.container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 2rem;
}

.hero {
    text-align: center;
    padding: 4rem 2rem;
    margin-bottom: 3rem;
}

.hero h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--jarvis-primary), var(--jarvis-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: glow 3s ease-in-out infinite;
}

@keyframes glow {
    0%, 100% { filter: drop-shadow(0 0 10px var(--jarvis-glow)); }
    50% { filter: drop-shadow(0 0 20px var(--jarvis-glow)); }
}

.hero p {
    font-size: 1.25rem;
    color: var(--jarvis-text-muted);
    max-width: 600px;
    margin: 0 auto;
}

/* Cards */
.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.card {
    background: rgba(26, 40, 71, 0.5);
    border: 1px solid var(--jarvis-border);
    border-radius: 12px;
    padding: 2rem;
    transition: all 0.3s;
    backdrop-filter: blur(10px);
}

.card:hover {
    transform: translateY(-5px);
    border-color: var(--jarvis-primary);
    box-shadow: 0 8px 30px var(--jarvis-glow);
}

.card-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    display: block;
}

.card h3 {
    color: var(--jarvis-primary);
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
}

.card p {
    color: var(--jarvis-text-muted);
    margin-bottom: 1rem;
}

.card a {
    color: var(--jarvis-accent);
    text-decoration: none;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s;
}

.card a:hover {
    gap: 1rem;
    color: var(--jarvis-primary);
}

/* Content */
.content {
    background: rgba(26, 40, 71, 0.3);
    border: 1px solid var(--jarvis-border);
    border-radius: 12px;
    padding: 3rem;
    backdrop-filter: blur(10px);
    margin-bottom: 2rem;
}

.content h1, .content h2, .content h3 {
    color: var(--jarvis-primary);
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.content h1 { font-size: 2.5rem; }
.content h2 { font-size: 2rem; }
.content h3 { font-size: 1.5rem; }

.content p {
    margin-bottom: 1rem;
    color: var(--jarvis-text-muted);
}

.content a {
    color: var(--jarvis-accent);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.3s;
}

.content a:hover {
    border-bottom-color: var(--jarvis-accent);
}

.content pre {
    background: var(--jarvis-darker);
    border: 1px solid var(--jarvis-border);
    border-radius: 8px;
    padding: 1.5rem;
    overflow-x: auto;
    margin: 1.5rem 0;
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
}

.content code {
    color: var(--jarvis-accent);
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.content pre code {
    color: var(--jarvis-light);
}

.content ul, .content ol {
    margin-left: 2rem;
    margin-bottom: 1rem;
    color: var(--jarvis-text-muted);
}

.content li {
    margin-bottom: 0.5rem;
}

/* Footer */
footer {
    background: rgba(10, 14, 39, 0.8);
    border-top: 1px solid var(--jarvis-border);
    padding: 2rem;
    text-align: center;
    margin-top: 4rem;
}

footer p {
    color: var(--jarvis-text-muted);
}

footer a {
    color: var(--jarvis-primary);
    text-decoration: none;
    transition: all 0.3s;
}

footer a:hover {
    color: var(--jarvis-accent);
}

/* Responsive */
@media (max-width: 768px) {
    .hero h1 { font-size: 2.5rem; }
    .nav-links { flex-direction: column; gap: 1rem; }
    .cards-grid { grid-template-columns: 1fr; }
    .container { padding: 1rem; }
}

/* Scroll animations */
.fade-in {
    animation: fadeIn 1s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
EOF

# Create JavaScript for interactivity
cat > "$TEMP_BUILD/assets/js/jarvis.js" << 'EOF'
// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add fade-in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.card, .content').forEach(el => {
    observer.observe(el);
});

// Add current year to footer
const yearElement = document.querySelector('.current-year');
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}
EOF

# Convert markdown to HTML with Jarvis theme
echo -e "${BLUE}Converting markdown to HTML...${NC}"

# Function to convert markdown to HTML
convert_md_to_html() {
    local md_file="$1"
    local html_file="${md_file%.md}.html"
    local title=$(basename "$md_file" .md)
    local content=$(cat "$md_file")

    # Basic markdown to HTML conversion (simplified)
    content=$(echo "$content" | sed 's/^# \(.*\)/<h1>\1<\/h1>/g')
    content=$(echo "$content" | sed 's/^## \(.*\)/<h2>\1<\/h2>/g')
    content=$(echo "$content" | sed 's/^### \(.*\)/<h3>\1<\/h3>/g')
    content=$(echo "$content" | sed 's/^\* \(.*\)/<li>\1<\/li>/g')
    content=$(echo "$content" | sed 's/\*\*\(.*\)\*\*/<strong>\1<\/strong>/g')
    content=$(echo "$content" | sed 's/\*\(.*\)\*/<em>\1<\/em>/g')
    content=$(echo "$content" | sed 's/`\([^`]*\)`/<code>\1<\/code>/g')

    cat > "$html_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Jarvis Documentation</title>
    <link rel="stylesheet" href="/assets/css/jarvis.css">
</head>
<body>
    <header>
        <div class="header-content">
            <a href="/" class="logo">
                <span class="logo-icon">🤖</span>
                <span class="logo-text">J.A.R.V.I.S.</span>
            </a>
            <nav>
                <ul class="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/start">Get Started</a></li>
                    <li><a href="/install">Install</a></li>
                    <li><a href="https://jarvis.allyapp.cc">Main Site</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <div class="container">
        <div class="content">
            ${content}
        </div>
    </div>

    <footer>
        <p>&copy; <span class="current-year">2026</span> Jarvis AI Assistant. All rights reserved.</p>
        <p>Powered by <a href="https://jarvis.allyapp.cc">Jarvis</a></p>
    </footer>

    <script src="/assets/js/jarvis.js"></script>
</body>
</html>
EOF
}

# Create main index.html
cat > "$TEMP_BUILD/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jarvis Documentation - Your AI Assistant</title>
    <link rel="stylesheet" href="/assets/css/jarvis.css">
</head>
<body>
    <header>
        <div class="header-content">
            <a href="/" class="logo">
                <span class="logo-icon">🤖</span>
                <span class="logo-text">J.A.R.V.I.S.</span>
            </a>
            <nav>
                <ul class="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/start">Get Started</a></li>
                    <li><a href="/install">Install</a></li>
                    <li><a href="https://jarvis.allyapp.cc">Main Site</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <div class="container">
        <div class="hero">
            <h1>🤖 J.A.R.V.I.S.</h1>
            <p>Just A Rather Very Intelligent System - Your Personal AI Assistant</p>
        </div>

        <div class="cards-grid">
            <div class="card">
                <span class="card-icon">🚀</span>
                <h3>Quick Start</h3>
                <p>Get up and running with Jarvis in minutes. Install on any platform.</p>
                <a href="/start">Get Started →</a>
            </div>

            <div class="card">
                <span class="card-icon">📦</span>
                <h3>Installation</h3>
                <p>Comprehensive installation guides for all supported platforms.</p>
                <a href="/install">Install Guide →</a>
            </div>

            <div class="card">
                <span class="card-icon">📚</span>
                <h3>Documentation</h3>
                <p>Complete documentation covering all features and capabilities.</p>
                <a href="/reference">View Docs →</a>
            </div>

            <div class="card">
                <span class="card-icon">💬</span>
                <h3>Channels</h3>
                <p>Connect Jarvis to Discord, Telegram, Slack, Signal, and more.</p>
                <a href="/channels">Channels →</a>
            </div>

            <div class="card">
                <span class="card-icon">🔌</span>
                <h3>Plugins</h3>
                <p>Extend Jarvis with powerful plugins and integrations.</p>
                <a href="/plugins">Plugins →</a>
            </div>

            <div class="card">
                <span class="card-icon">🏗️</span>
                <h3>Architecture</h3>
                <p>Learn about Jarvis's architecture and design principles.</p>
                <a href="/architecture">Architecture →</a>
            </div>
        </div>

        <div class="content">
            <h2>Welcome to Jarvis</h2>
            <p>Jarvis is your personal AI assistant that works across all your favorite platforms and devices. Whether you're on macOS, Linux, Windows, iOS, or Android, Jarvis is there to help.</p>

            <h3>Key Features</h3>
            <ul>
                <li>🌐 Multi-platform support (macOS, Linux, Windows, iOS, Android)</li>
                <li>💬 Connect to Discord, Telegram, Slack, Signal, WhatsApp, and more</li>
                <li>🤖 Powered by Claude, GPT-4, and other leading AI models</li>
                <li>🔌 Extensible plugin system</li>
                <li>🎨 Beautiful, customizable interface</li>
                <li>🔒 Privacy-focused with local processing options</li>
            </ul>

            <h3>Quick Install</h3>
            <pre><code>curl -fsSL https://jarvis.allyapp.cc/install.sh | bash</code></pre>

            <h3>Getting Help</h3>
            <p>Need assistance? Check out our <a href="/help">help section</a> or join our community on Discord.</p>
        </div>
    </div>

    <footer>
        <p>&copy; <span class="current-year">2026</span> Jarvis AI Assistant. All rights reserved.</p>
        <p>Powered by <a href="https://jarvis.allyapp.cc">Jarvis</a></p>
    </footer>

    <script src="/assets/js/jarvis.js"></script>
</body>
</html>
EOF

echo -e "${BLUE}Converting markdown files...${NC}"
find "$TEMP_BUILD" -name "*.md" -type f | while read md_file; do
    echo "  Converting: $md_file"
    convert_md_to_html "$md_file"
done

# Deploy to production
echo -e "${BLUE}Deploying to production...${NC}"
sudo rm -rf "$DOCS_OUTPUT"
sudo mkdir -p "$DOCS_OUTPUT"
sudo cp -r "$TEMP_BUILD"/* "$DOCS_OUTPUT/"
sudo chown -R caddy:caddy "$DOCS_OUTPUT"
sudo chmod -R 755 "$DOCS_OUTPUT"

# Update Caddyfile to point to built docs
echo -e "${BLUE}Updating Caddyfile...${NC}"
sudo sed -i 's|root \* /var/www/jarvis/docs|root * /var/www/jarvis/docs-built|g' /etc/caddy/Caddyfile

# Reload Caddy
echo -e "${BLUE}Reloading Caddy...${NC}"
sudo systemctl reload caddy

echo -e "${GREEN}✅ Documentation built and deployed successfully!${NC}"
echo -e "${YELLOW}Visit: https://docs.jarvis.allyapp.cc${NC}"
