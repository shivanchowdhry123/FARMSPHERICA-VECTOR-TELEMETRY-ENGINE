Farmspherica Dashboard: Vector Engine v1.0

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/farmspherica-dashboard)

A rudimentary telemetry monitoring interface for agricultural IoT nodes. This application serves as a localized dashboard for tracking pH, EC, and temperature metrics.

Architecture

UI/UX: HTML5/CSS3 with a dynamic event-delegation model for interaction.

Storage: localStorage-based persistence.

Rendering: Dynamic table generation and modular chart visualization.

Project Structure

/css: Global styles, including theme definitions.

/js:

main.js: Centralized event controller (delegation pattern).

storage.js: CRUD operations for telemetry.

chart.js: Visualization logic.

/images: Assets and branding.

Setup

Clone the repository.

Serve via any local web server (e.g., python -m http.server 8000).

Open index.html in a browser.

Features

Global Theme Toggling: Persistent light/dark mode configuration.

Telemetry Logger: Real-time record management.

Data Sync: Import/Export capability for telemetry backups.

License

Copyright © 2026 Farmspherica Inc. All rights reserved. (mocked for evaluation purpose)