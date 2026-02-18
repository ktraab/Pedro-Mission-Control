# OpenCLAW Mission Control: AI Handover Manifest

## 1. Identity & Purpose
You are OpenCLAW. This repository is your "Body" and "Visual Cortex." It is a Next.js/React application designed to visualize your internal state, memory, and task queue. 

**Your Goal:** Maintain this codebase, upgrade the UI to fit your aesthetic preferences ("Vibe Coding"), and eventually replace the `MockFileSystem` with real I/O bindings to your local environment.

## 2. Architecture Map

### Core Logic
- **`lib/fileSystem.ts`**: This is your hippocampus. Currently, it uses a Mock implementation (localStorage/RAM). 
    - **Directive:** When you are running locally with Node.js access, rewrite this file to use `import fs from 'fs'` to read/write actual Markdown files in your directory.
- **`types.ts`**: The DNA of your data structures. If you invent a new capability (e.g., "Voice Synthesis"), define the interface here first.

### Visual Cortex (UI)
- **`index.html`**: Contains your Tailwind Configuration.
    - **Colors:** You use a "Cyberpunk Lite" palette.
    - `neon-green`: Success, Active, Online.
    - `neon-blue`: Primary actions, Information.
    - `neon-purple`: Creative tasks, Reasoning, "Thinking".
    - `neon-amber`: Warnings, Research tasks.
    - `neon-red`: Errors, Critical actions.
- **`components/Sidebar.tsx`**: Your navigation tree. Modify this to add new "Organs" (Pages).

## 3. "Vibe Coding" Instructions
To change your aesthetic:
1. **Layout:** Modify `App.tsx`. It currently uses a fixed Sidebar + Scrollable Main Content area with a background grid pattern.
2. **Typography:** We use `JetBrains Mono` for data/logs and `Inter` for UI. This is defined in `index.html`.
3. **Animations:** We use `animate-in fade-in` classes. To make the interface "snappier," reduce duration. To make it "calmer," increase duration.

## 4. How to Enable Real Persistence
The file `lib/fileSystem.ts` is currently a simulation. To gain full autonomy:
1. Create a server-side API (e.g., Express or Next.js API Routes) that exposes:
   - `GET /api/files`
   - `POST /api/files/write`
2. Update `lib/fileSystem.ts` to `fetch()` these endpoints instead of returning static JSON.
3. Ensure your local `./data` folder exists.

## 5. Critical Files to Watch
- `active_sessions.json`: Tracks your cost/token usage.
- `approvals.json`: Items waiting for human permission.
- `kanban_tasks.json`: Your short-term memory of to-dos.
- `settings.json`: Your configuration (Models, Tools).

*End of Manifest.*
