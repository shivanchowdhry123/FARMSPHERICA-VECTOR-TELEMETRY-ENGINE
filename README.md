# Farmspherica Dashboard: Vector Telemetry Engine v2.0

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/farmspherica-dashboard)

A zero-backend, enterprise-grade telemetry monitoring dashboard for agricultural IoT hydroponic systems. Built entirely with vanilla HTML, CSS, and JavaScript — no frameworks, no server.

## Architecture

- **UI/UX**: HTML5 / CSS3 with CSS custom properties (light & dark themes), glassmorphism panels, and micro-animations.
- **State Management**: `localStorage`-based persistence for telemetry data, settings, and authentication.
- **Event System**: Centralized click-delegation model (`data-action` attributes) — zero inline handlers.
- **Visualization**: Native HTML5 Canvas 2D API for radar and heatmap charts (zero charting dependencies on Analytics page). Chart.js used only on Dashboard trend lines.

## Features

| Feature | Description |
|---|---|
| **6-Variable Telemetry** | pH, EC, Air Temp, Reservoir Temp, Dissolved Oxygen, Lux |
| **Facility Vitality Index (FVI)** | Synthesized harmony score computed from all 6 parameters |
| **Biosecurity Warning Engine** | Real-time threshold monitoring with sliding notification banners and remediation protocols |
| **Comfort Zone Configuration** | Fully user-configurable min/max bounds for all parameters via Settings |
| **Vector Analytics Room** | Zero-dependency Canvas-based radar chart and temporal heatmap |
| **Telemetry Logger** | Full CRUD with bulk select, multi-export (JSON), and batch delete |
| **Node Hardware Grid** | 12-node monitoring panel with live alarm state propagation |
| **Terminal Console** | Monospaced scrolling log stream with ingestion, warning, and resolution events |
| **Authentication Guard** | Session-based login gate; protected pages redirect to login if unauthenticated |
| **Theme Persistence** | Global light/dark toggle persisted across all pages |
| **Import / Export** | Full JSON backup and restore of telemetry datasets |

## Project Structure

```
/css
  styles.css        → Design system with theme tokens, layout, and component styles

/js
  main.js           → Centralized event controller, FVI calculator, biosecurity engine, auth guard
  storage.js        → localStorage CRUD for telemetry, settings, and user profile
  chart.js          → Canvas 2D radar and heatmap renderers for Analytics page

/images
  logo.svg          → Farmspherica brand logo
  profile-placeholder.png

index.html          → Login portal (entry point)
dashboard.html      → FVI cards, Chart.js trend lines, terminal console
analytics.html      → Canvas radar chart and temporal heatmap
logger.html         → Telemetry data table with bulk actions
nodes.html          → 12-node hardware status grid
settings.html       → Theme, comfort zones, account, alerts, data sync
add.html            → Telemetry vector ingestion form
```

## Setup

1. Clone the repository.
2. Serve via any local web server (e.g., `python -m http.server 8000`).
3. Open `index.html` in a browser.
4. Login with any email/password to access the dashboard.

## Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, grid, flexbox, backdrop-filter
- **JavaScript (ES Modules)** — No frameworks, no build tools
- **Chart.js** (CDN) — Dashboard trend chart only
- **localStorage** — All persistence

## License

Copyright © 2026 Farmspherica Inc. All rights reserved. (mocked for evaluation purpose)