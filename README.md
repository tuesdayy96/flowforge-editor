# FlowForge

FlowForge is a browser-based visual workflow editor built with React and TypeScript.

## Getting started

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The app runs entirely in the browser.

## Phase 1

The editor includes a toolbar, a reference palette for Start, Action, Condition and End, a property inspector placeholder, and an empty React Flow canvas. Drag to pan, scroll to zoom, or use the zoom buttons.

Node creation, connections, property editing and persistence are planned for later phases.

## Verification

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Use `npm run preview` to serve the production build locally. See [Architecture](docs/architecture.md) for the project structure.
