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

- Each session starts with one Start node. Add Action, Condition or End from the palette to place it at the center of the current view.
- Drag nodes by their cards and connect an output to an input. Each output supports one connection. Condition's true and false outputs are independent. Connections that would create a cycle are blocked.
- Select one node to edit its label and description. Shift-drag a selection box to select multiple nodes.
- Select a node or connection and use **Delete selection**, Delete or Backspace. Deleting a node removes its connections. The Start node remains in the workflow.
- Drag the canvas to pan, scroll to zoom, and use the canvas controls to zoom or fit the graph.

- Select **Validate** to check whether the workflow is ready to run. Use **Locate** beside an issue to select its node and center the canvas on it. After adding or removing nodes or connections, run Validate again.

You can keep editing an incomplete workflow. Edits live in memory for the current session.

## Verification

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

Use `npm run preview` to serve the production build locally. See [Architecture](docs/architecture.md) for the project structure.
