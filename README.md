# Mountain Tickets

A local, self-hosted Jira/Linear-style kanban ticket tracker. Everything
(tickets, comments, checklists, workspaces) lives in a single SQLite file —
no cloud, no accounts, no subscription.

Runs two ways:
- **As a Windows desktop app** (Electron), with its own window and a
  double-click Desktop shortcut.
- **As a headless server** on your own network (e.g. a Raspberry Pi), so
  multiple computers can reach the same board from a browser.

## Features

- Kanban board with drag-and-drop, fully custom columns (rename, add,
  delete — with a prompt to move tickets out of a column before it's
  deleted)
- **Workspaces**: keep tickets from different companies/contexts separate,
  with a filter bar to switch between them or view everything at once
- Priorities, deadlines (with overdue highlighting), comma-separated labels
- Per-ticket checklists ("action items") with a progress badge on the card
- Comments per ticket
- Light/dark mode, remembered across restarts
- Collapsible columns, remembered across restarts (handy once "Done" has
  100 tickets in it)
- Search across titles and labels

## Setup (desktop app)

```bash
npm run install:all
npm run app
```

`npm run app` builds the frontend and launches the Electron window. For
day-to-day use on Windows, [launch.vbs](launch.vbs) launches it silently
(no console flash) — point a Desktop shortcut at it for a normal
double-click launch. Note `launch.vbs` resolves its own folder at runtime,
so it works from wherever the repo is cloned, but a Desktop *shortcut*
pointing at it is obviously machine-specific and won't be part of the repo.

### Desktop development

Hot-reloads both the server and the UI:

```bash
npm run dev
```

## Setup (headless server / LAN hosting)

On the server (e.g. a Raspberry Pi running Node 22.5+ — needed for the
built-in SQLite module):

```bash
npm run install:server   # skips the ~200MB Electron dependency entirely
npm run build
npm start
```

This serves the app (API + built frontend) on port 4000. Open
`http://<server-ip>:4000` from any computer on the network. Set `PORT` to
change the port.

Use `pm2` or a `systemd` unit to keep it running and restart it on boot —
`node server/index.js` in a plain SSH session dies when you disconnect.

**Heads up if you're running this from multiple computers at once:** the
app currently only fetches tickets when a window/tab first opens, not on
an ongoing basis. If two people have it open at the same time, one won't
see the other's changes until they reload. Fine for occasional multi-device
use; ask if you want live sync added.

**No authentication exists.** Anyone who can reach the port has full
access — fine on a trusted home LAN, but don't port-forward this to the
open internet as-is.

## Data

Your data lives in `data/tickets.db`. Back it up by copying that file
(it's git-ignored, so it never ends up in the repo). Delete it to start
fresh — it's recreated automatically, along with the default columns.
