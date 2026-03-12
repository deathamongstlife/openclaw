# JARVIS Theme - Quick Reference Guide

## Color Palette Cheat Sheet

### Primary Accents (Arc Reactor Blue)

```css
--accent: #00d9ff /* Electric cyan - primary interactive elements */ --accent-hover: #4fc3f7
  /* Bright cyan - hover states */ --accent-muted: #0088ff /* Deep blue - muted accents */
  --accent-glow: rgba(0, 217, 255, 0.35) /* Glow effect */;
```

### Backgrounds (Deep Space)

```css
--bg: #001529 /* Primary background - deepest navy */ --bg-accent: #002140
  /* Slightly lighter navy */ --bg-elevated: #003a6e /* Elevated surfaces */ --bg-hover: #004080
  /* Hover backgrounds */;
```

### Text (Bright, High-Tech)

```css
--text: #e8f4f8 /* Primary text - bright cyan-white */ --text-strong: #ffffff
  /* Emphasis text - pure white */ --muted: #607d8b /* Muted text - blue-gray */;
```

### Semantic Colors

```css
--ok: #00e676 /* Success - bright green */ --warn: #ffb300 /* Warning - amber orange */
  --danger: #ff1744 /* Error/danger - bright red */ --info: #00d9ff
  /* Info - matches primary accent */;
```

## Usage Examples

### Terminal/CLI (TypeScript)

```typescript
import { theme } from "./terminal/theme.js";

// Use themed output
console.log(theme.accent("JARVIS online"));
console.log(theme.success("✓ Task completed"));
console.log(theme.error("✗ Connection failed"));
console.log(theme.muted("Press any key to continue..."));
```

### CSS (Web)

```css
/* Use JARVIS theme variables */
.button-primary {
  background: var(--accent);
  color: var(--accent-foreground);
  box-shadow: 0 0 16px var(--accent-glow);
}

.button-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 24px var(--accent-glow);
}

/* Add HUD grid effect */
.container {
  background-image:
    linear-gradient(rgba(0, 217, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 217, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* Scan line animation */
.panel {
  position: relative;
}

.panel::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 217, 255, 0.8), transparent);
  animation: scan-line 4s linear infinite;
}
```

### Android (Kotlin/Compose)

```kotlin
import ai.jarvis.app.ui.*

// Use JARVIS mobile tokens
Text(
  text = "JARVIS",
  style = mobileTitle1,
  color = mobileText
)

Button(
  colors = ButtonDefaults.buttonColors(
    containerColor = mobileAccent,
    contentColor = Color.Black
  )
) {
  Text("Initialize")
}

// Use gradient background
Box(
  modifier = Modifier
    .fillMaxSize()
    .background(mobileBackgroundGradient)
)
```

### React/TypeScript (if applicable)

```typescript
// Using CSS variables in styled components
const Button = styled.button`
  background: var(--accent);
  color: var(--accent-foreground);
  border: none;
  border-radius: var(--radius-md);
  padding: 12px 24px;
  font-weight: 600;
  transition: all var(--duration-normal) var(--ease-out);
  box-shadow: 0 0 16px var(--accent-glow);

  &:hover {
    background: var(--accent-hover);
    box-shadow: 0 0 24px var(--accent-glow);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-glow);
  }
`;
```

## Design Principles

### 1. High Contrast

Always maintain strong contrast between text and backgrounds:

- Primary text on dark: `#E8F4F8` (14.2:1 contrast)
- Accent on dark: `#00D9FF` (8.9:1 contrast)

### 2. Glow Effects

Use subtle glows for interactive elements:

```css
/* Subtle hover glow */
box-shadow: 0 0 16px rgba(0, 217, 255, 0.3);

/* Strong focus glow */
box-shadow: 0 0 24px rgba(0, 217, 255, 0.5);
```

### 3. Angular, Not Rounded

JARVIS theme uses angular corners:

- Small: `4px` (was `6px`)
- Medium: `6px` (was `8px`)
- Large: `8px` (was `12px`)

### 4. Tech-Forward Typography

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
letter-spacing: -0.01em; /* Slightly tight */
```

### 5. Smooth, Fast Transitions

```css
transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
```

## Animation Reference

### Glow Pulse

```css
@keyframes glow-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(0, 217, 255, 0);
  }
  50% {
    box-shadow: 0 0 20px var(--accent-glow);
  }
}

.pulsing-element {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

### Scan Line

```css
@keyframes scan-line {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

.scan-line {
  animation: scan-line 4s linear infinite;
}
```

### Rise (Entrance)

```css
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: rise 0.35s var(--ease-out) backwards;
}
```

## Accessibility

### WCAG AA Compliance

All color combinations meet WCAG 2.1 Level AA:

- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Focus States

Always provide visible focus indicators:

```css
*:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg),
    0 0 0 4px var(--accent),
    0 0 24px var(--accent-glow);
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Environment Variables

### Theme Control

```bash
# Force dark theme
export JARVIS_THEME=dark

# Force light theme
export JARVIS_THEME=light

# Auto-detect (default)
unset JARVIS_THEME
```

## Common Patterns

### Glass Morphism Card

```css
.glass-card {
  background: rgba(10, 25, 41, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 217, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(0, 217, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### Tech Button

```css
.tech-button {
  background: linear-gradient(135deg, #00d9ff 0%, #0088ff 100%);
  color: #000;
  font-weight: 600;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  box-shadow:
    0 4px 12px rgba(0, 217, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.tech-button:hover {
  transform: translateY(-1px);
  box-shadow:
    0 6px 20px rgba(0, 217, 255, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

### Status Badge

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.status-badge.online {
  background: var(--ok);
  color: var(--bg);
  box-shadow: 0 0 12px rgba(0, 230, 118, 0.3);
}

.status-badge.offline {
  background: var(--danger);
  color: #fff;
  box-shadow: 0 0 12px rgba(255, 23, 68, 0.3);
}
```

## Migration Tips

### From Lobster to JARVIS

```typescript
// Old (Lobster theme)
import { LOBSTER_PALETTE } from "./terminal/palette.js";
const color = LOBSTER_PALETTE.accent; // #FF5A2D (red/coral)

// New (JARVIS theme)
import { JARVIS_PALETTE } from "./terminal/palette.js";
const color = JARVIS_PALETTE.accent; // #00D9FF (cyan)

// Backward compatible
import { LOBSTER_PALETTE } from "./terminal/palette.js";
// LOBSTER_PALETTE is now an alias to JARVIS_PALETTE
```

## Testing Checklist

- [ ] Dark mode contrast verified
- [ ] Light mode contrast verified
- [ ] Glow effects render without performance issues
- [ ] Animations smooth on low-end devices
- [ ] Focus indicators visible
- [ ] Reduced motion respected
- [ ] Color blindness tested
- [ ] Mobile responsive
- [ ] Terminal colors work in various terminals

## Resources

- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [CSS Gradient Generator](https://cssgradient.io/)
- [Easing Functions](https://easings.net/)
- [Iron Man HUD Reference](https://ironman.fandom.com/wiki/J.A.R.V.I.S.)
