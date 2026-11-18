# FlowForge

FlowForge is a browser-based visual workflow editor built with React and TypeScript.

## Getting started

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The app runs entirely in the browser.

## Edit a workflow

- A new draft starts with one Start node. Add more Start nodes, or add Action, Condition, Merge and End from the palette.
- Drag nodes by their cards and connect an output to an input. Each output supports one connection. Condition's true and false outputs are independent. Connections that would create a cycle are blocked.
- Select one node to edit its label and description. Shift-drag a selection box to select multiple nodes.
- Select a node or connection and use **Delete selection**, Delete or Backspace. Deleting any node, including a Start, removes its connections.
- Drag the canvas to pan, scroll to zoom, and use the canvas controls to zoom or fit the graph.

- Select **Validate** to check whether the workflow is ready to run. Use **Locate** beside an issue to select its node and center the canvas on it. After adding or removing nodes or connections, run Validate again.
- Each Start is an independent entry point. A Merge brings multiple paths together visually and has one output. The editor does not define execution synchronization for Merge.

## Editor shortcuts

Click or tab to the canvas to use editor shortcuts. Text fields keep their standard keyboard behavior. Use Ctrl/Cmd-click or Shift-drag to select several nodes and move, copy or delete them together.

| Action           | Windows / Linux        | macOS              |
| ---------------- | ---------------------- | ------------------ |
| Undo             | Ctrl+Z                 | Cmd+Z              |
| Redo             | Ctrl+Shift+Z or Ctrl+Y | Cmd+Shift+Z        |
| Copy / Paste     | Ctrl+C / Ctrl+V        | Cmd+C / Cmd+V      |
| Select all       | Ctrl+A                 | Cmd+A              |
| Delete selection | Delete / Backspace     | Delete / Backspace |
| Fit view         | Ctrl+0                 | Cmd+0              |

The toolbar also provides Undo, Redo, Copy, Paste and Fit view. Use MiniMap to toggle the overview and drag or zoom there to navigate the canvas. Copy and Paste use the editor clipboard and duplicate links between selected nodes. Undo and Redo keep up to 100 edits in the current document session.

## Save and share a draft

- Edits and the canvas viewport are saved automatically in this browser. The toolbar reports when the local draft was saved or when a write failed. Refreshing restores the last saved draft.
- **Export JSON** downloads the current draft with its node IDs, positions and connections. **Import JSON** checks the file and asks before replacing the current workflow. A structurally valid draft can be imported even when its graph is incomplete.
- If the browser cannot restore its draft, the editor preserves the stored value and pauses autosave. **Replace local draft** overwrites it after confirmation. A failed write can be retried, and the current document can be exported.

See [Document format](docs/data-model.md) for the version and limits.

## Verification

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

Use `npm run preview` to serve the production build locally. See [Architecture](docs/architecture.md) for the project structure.
