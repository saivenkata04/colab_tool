# ⚡ SyncCode — Real-Time Developer Collaboration Platform

> **Build together. In real time.**  
> A production-grade collaborative workspace built with **React 18, TypeScript, Monaco Editor, Tailwind CSS 3.4, Yjs CRDT, Node.js, Express, WebSockets (`ws`), and Prisma ORM**.

---

## 1. Brand Identity & Design Principles

SyncCode is engineered with a **clean, developer-focused, high-information-density UI/UX** inspired by **VS Code, Linear, Google Docs, and Figma**.

### Design Principles
- **Minimal & Distraction-Free**: Deep dark charcoal surfaces (`#0B0D10`) instead of harsh pure black.
- **Developer-Centric**: Inter for crisp UI typography; JetBrains Mono for code, keyboard shortcuts, and metadata.
- **Immediate Clarity**: In under 5 seconds, developers immediately see:
  1. What workspace they are in
  2. What file they are editing
  3. Who else is online
  4. Whether changes are synchronized (`✓ Saved` vs `● Saving`)
  5. How to share the room
- **Keyboard-First Workflow**: Command palette (`Ctrl + K`), explorer toggle (`Ctrl + B`), comments drawer (`Ctrl + /`), and dialog dismiss (`Esc`).

### Color System & Design Tokens
| Token | Hex | Role |
| :--- | :--- | :--- |
| `--bg-base` | `#0B0D10` | App background |
| `--surface` | `#111418` | Top bar, sidebars, panels |
| `--surface-elevated` | `#171B21` | Cards, popovers, dropdowns, inputs |
| `--border` | `#252A33` | Component dividers & subtle outlines |
| `--primary` | `#6366F1` | Indigo / Violet primary accent |
| `--primary-hover` | `#818CF8` | Interactive button hover |
| `--text-primary` | `#F5F7FA` | High-contrast readable typography |
| `--text-secondary` | `#9CA3AF` | Supporting labels, paths, timestamps |
| `--success` | `#22C55E` | Connected live indicator, CRDT synced |
| `--warning` | `#F59E0B` | Unsaved buffer indicator |
| `--error` | `#EF4444` | Disconnected state, deletions |
| `--info` | `#38BDF8` | Code files & TypeScript badges |

---

## 2. Key Architecture & Features

### 🖥️ Top Navigation
- Workspace breadcrumbs: `SyncCode / [Workspace] / [Document]` with save status indicators.
- Quick search trigger to jump to documents and commands (`Ctrl + K`).
- Connection status badge with latency popover: `● Live` (~18ms sync over Yjs WebSockets).
- Real-time collaborator avatar stack with rich hover presence cards showing email and activity.
- 1-click **Share** modal and user account menu.

### 📁 Collapsible Left Sidebar (260px expanded / 56px collapsed)
- IDE file tree grouping **Code Files** (`src/`) and **Rich Notes** (`docs/`).
- Quick creation buttons for Python, TypeScript, JavaScript, HTML, CSS, JSON, and Markdown files.
- Collapsible with `Ctrl + B` or the toggle icon.

### 💻 Main Editor (Monaco & Rich Notes)
- **Code Mode (Monaco Editor)**:
  - VS Code editing core with full syntax highlighting.
  - Multi-user remote cursor presence with personalized colors and name labels.
  - VS Code style tab bar with document close buttons and saved `✓` / unsaved `●` state.
  - Integrated console runner capturing `console.log` and runtime return values.
  - Fullscreen toggle and line-by-line comment pinning.
- **Notes Mode (Google Docs / Notion)**:
  - Rich-text markdown toolbar: Headings (H1-H3), Bold, Italic, Checklists, Bullet/Numbered Lists, Blockquotes, and Code blocks.
  - Split view, Markdown edit, and Live rendered preview modes.
  - Centered readable document canvas with word and character counters.

### 👥 Right Collaboration Panel
- **Comments Tab**: View threaded comments pinned to specific line numbers (e.g. *Line 24: "Can we optimize this loop?"*), reply, and toggle resolve.
- **Members Tab**: List active members, their assigned roles (`Owner`, `Editor`, `Viewer`), and live online indicators.
- **Activity Feed Tab**: Real-time audit log of collaborators joining, saving files, and editing documents.

### ⚡ Command Palette (`Ctrl + K`)
- Search any file or note in the workspace.
- Jump directly to actions: Create Code File, Create Rich Note, Invite Collaborator, Toggle Sidebar, Toggle Comments, Execute Code.

### 🔗 Share Modal
- Invite collaborators by email.
- Assign roles (`Editor`, `Viewer`).
- Copy instant invite links with 1-click feedback (`✓ Link copied`).

---

## 3. Mathematical Yjs CRDT Synchronization

SyncCode avoids naive document-overwriting architectures. Instead, every keystroke translates into an incremental binary Yjs update:

```
User A (Browser)                  User B (Browser)
       │                                 │
  Monaco Editor                     Monaco Editor
       │                                 │
  Y.Doc (CRDT)                      Y.Doc (CRDT)
       │                                 │
       └──────────────┐   ┌──────────────┘
                      ▼   ▼
             WebSocket (ws://localhost:8080)
                      │
            Node.js Collaboration Server
             - Incremental CRDT Broadcast
             - Awareness & Cursor Tracking
             - Auto-Save Debounce Engine (2s)
                      │
             Express REST API (Port 5000)
                      │
             PostgreSQL / Prisma ORM
```

---

## 4. Quick Start & Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/synccode.git
cd synccode

# Install dependencies across all workspaces
npm install
```

### Running Locally
To launch both the backend (REST API on port `5000` + WebSocket server on port `8080`) and frontend (Vite dev server on port `5173`):

```bash
npm run dev
```

Then visit **`http://localhost:5173`** in your browser.

### Demo Credentials
Pre-seeded demo accounts ready for instant pair-programming:
- **User 1**: `demo1@example.com` / `password123` (Sai Krishna - Full Stack Lead)
- **User 2**: `demo2@example.com` / `password123` (Rahul Sharma - Frontend Engineer)

---

## 5. Advanced Pro Features

### 🌟 1. Document Version History & Visual Diff Viewer (Git-Light)
- Create named checkpoints (e.g. `Stable Benchmark v1.0`, `Added Binary Search`).
- Visual diff viewer showing lines added (`+` in green), removed (`-` in red), and unchanged lines.
- 1-click **Restore this Version** that synchronizes across all active room peers.
- Shortcut: `Ctrl + H` or the clock icon in the toolbar.

### 🤖 2. SyncCode AI Copilot & Code Intelligence
- Contextual code analysis in Python, TypeScript, and JavaScript.
- Actions: **Explain Code**, **Find Bugs & Optimize**, **Generate Unit Tests**, and **Clean Refactor**.
- 1-click **Apply to Editor** directly updates active document via Yjs CRDT.
- Shortcut: `Ctrl + I` or the `Sparkles` icon in the toolbar.

### 💬 3. Real-Time Workspace Chat
- Dedicated **Chat tab** in the Right Collaboration Panel alongside Comments and Members.
- Instant peer messaging with formatted code snippets and timestamped user tags.

### 📥 4. 1-Click Workspace Export as ZIP
- Packages the entire workspace into a `.zip` archive structured into `src/` (code) and `docs/` (markdown notes) with an autogenerated manifest `README.md`.
- Click **Export ZIP** in the top navigation bar.

### 🎨 5. Monaco Pro Theme Switcher
- Choose between curated developer themes: **VS Code Dark**, **SyncCode Charcoal**, **High Contrast**, and **Clean Light**.
- Click the palette icon in the editor toolbar to switch instantly.

---

## 6. Verification & Automated Test Suites

SyncCode includes two automated test suites:

```bash
# 1. Test CRDT multi-user convergence and WebSocket keystroke broadcasting
node test_e2e_crdt.js

# 2. Test Advanced Pro Features (AI Copilot, Version History, Workspace Chat)
node test_new_features.js
```

---

## 7. Keyboard Shortcuts Reference

| Shortcut | Description |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open Command Palette |
| `Ctrl + \`` | Toggle VS Code-style Terminal Panel |
| `Ctrl + I` | Open AI Copilot Assistant |
| `Ctrl + H` | Open Document Version History & Diff Viewer |
| `Ctrl + B` / `Cmd + B` | Toggle Left File Explorer (expanded / collapsed) |
| `Ctrl + /` / `Cmd + /` | Toggle Right Collaboration Panel (Comments / Chat / Members) |
| `Ctrl + Enter` | Quick-run active Python/JavaScript code in the terminal |
| `Esc` | Close any active modal, popover, or command palette |

"# colab_tool" 
