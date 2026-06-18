# sp-ui-shell

**Sovereign OS — Desktop Host Shell**

The top-level application host for the Sovereign OS platform. Built with SvelteKit and packaged as a cross-platform desktop application via Tauri. Orchestrates all micro-frontend modules through a unified navigation shell.

[![Version](https://img.shields.io/badge/version-1.6.0-blue.svg)]()
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-orange.svg)](https://kit.svelte.dev/)
[![Svelte](https://img.shields.io/badge/Svelte-5.x-red.svg)](https://svelte.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-brightgreen.svg)](https://tauri.app/)

---

## Overview

`sp-ui-shell` is the host application that composes all Sovereign OS micro-frontends into a cohesive desktop experience. It manages:

- Application-level routing and navigation sidebar
- Module activation system: users enable or disable modules (Vault, Projects, RAG, Coding) from Settings
- Global settings UI: AI engine configuration, SecOps Vault management, system preferences
- Tauri sidecar integration: bundles `sp-service` binary for offline-capable desktop operation
- Multi-OS desktop packaging via GitHub Actions CD pipeline

---

## Module System

Modules are dynamically activated by the user at runtime. Only the Chat module is enabled by default. All other modules can be toggled in Settings > Modules without restarting the application.

| Module ID | Package | Description |
|-----------|---------|-------------|
| `chat` | sp-ui-chat | Always active — AI chat interface |
| `vault` | sp-ui-vault | Knowledge vault and document editor |
| `projects` | sp-ui-projects | Kanban project and task management |
| `rag` | sp-ui-rag | Deep research and cognitive graph |
| `coding` | sp-ui-coding | Code editor, file explorer, and terminal |

Module state is persisted to the `sp-service` SQLite database via the `/v1/settings` endpoint.

---

## Requirements

- Node.js 22 or newer
- Rust 1.75 or newer (for Tauri build)
- `sp-service` binary (see below)

---

## Development

```bash
# Install dependencies
npm install

# Start development server (web only, no Tauri)
npm run dev

# Start with Tauri desktop window
npm run tauri dev
```

The development server runs at `http://localhost:5173`. It expects `sp-service` to be running at `http://localhost:38001`.

---

## Building

```bash
# Build web assets only
npm run build

# Build and package desktop application (all platforms)
npm run tauri build
```

Tauri bundles produce platform-native installers:
- Linux: `.deb` and `.AppImage`
- macOS: `.dmg`
- Windows: `.msi` and `.exe`

---

## Desktop Release Pipeline

The CD pipeline at `.github/workflows/release.yml` automates cross-platform packaging.

**Trigger:** Push a tag matching `v*.*.*` to this repository.

```bash
git tag v1.6.0
git push origin v1.6.0
```

**Pipeline steps:**
1. Checkout source on Ubuntu, macOS (Intel + Silicon), and Windows runners
2. Download the matching `sp-service` binary from the `sp-service` GitHub release into `src-tauri/binaries/`
3. Run `tauri-apps/tauri-action` to build and sign the installers
4. Publish a GitHub Release draft with all platform artifacts

**Manual trigger:** Available via `workflow_dispatch` in the GitHub Actions UI, accepting a `tag` input parameter.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PUBLIC_API_BASE_URL` | `http://localhost:38001` | Backend service URL |
| `PUBLIC_APP_VERSION` | from package.json | Displayed in the UI sidebar |

---

## Project Structure

```
sp-ui-shell/
├── src/
│   ├── routes/              # SvelteKit page routes
│   │   └── +layout.svelte   # Root layout with sidebar and module slots
│   └── lib/
│       └── components/
│           ├── SidebarTree.svelte     # Navigation sidebar (module-aware)
│           └── SettingsModal.svelte   # Global settings overlay
├── src-tauri/
│   ├── src/main.rs          # Tauri entry point
│   ├── binaries/            # sp-service sidecar (populated by CI)
│   └── tauri.conf.json      # Tauri configuration
└── .github/
    └── workflows/
        └── release.yml      # Multi-OS CD pipeline
```

---

## License

PolyForm Noncommercial 1.0.0. See [LICENSE](../LICENSE).

---

**Version:** 1.6.0  
**Last updated:** 2026-05-24
