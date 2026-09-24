# Mountain Tickets — System Overview

A self-hosted kanban ticket tracker, purpose-built to replace commercial
tools like Jira/Trello for internal use across multiple businesses and
personal tasks, with the entire dataset kept private and self-owned rather
than living in a third-party's cloud.

## Architecture

- **Frontend:** React (built with Vite), plain CSS with a light/dark theme
  system, drag-and-drop via `@dnd-kit`.
- **Backend:** Node.js + Express, exposing a REST API for tickets,
  workspaces, columns, checklists, and comments.
- **Database:** SQLite, accessed through Node's built-in `node:sqlite`
  module — a single file on disk, no external database server or ORM
  involved.
- **Desktop client:** The same frontend/backend also ships as a native
  Windows desktop app via Electron, with its own window and a Desktop
  shortcut, for use without a server.

## Key features

Customizable kanban columns (rename/add/delete), "workspaces" to keep
tickets from different companies/contexts separate, per-ticket checklists
with progress tracking, deadlines, comments, labels, priorities, and
collapsible columns for long lists.

## Hosting

- Runs headlessly (no Electron, no GUI needed) on a Ubuntu server on the
  home network, as a `systemd` service — starts automatically on boot,
  restarts itself if it ever crashes.
- Accessed by any device on the LAN via a normal web browser, pointed at
  the server's IP on port 4000. No installation needed on client devices.
- Not exposed to the internet — LAN-only, opened through the firewall for
  just that one port. There's currently no authentication layer, so access
  is trust-based within the home network.

## Data & source control

- All data lives in one SQLite file (`data/tickets.db`) on the server's
  disk; backups are as simple as copying that file.
- Source code is version-controlled in a private GitHub repo; the database
  itself is deliberately excluded from git (see `.gitignore`) so no ticket
  data — business or personal — ever leaves the server.
