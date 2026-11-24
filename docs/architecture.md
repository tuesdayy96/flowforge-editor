# Architecture

## Presentation

`src/main.tsx` mounts React in strict mode. `src/app/App.tsx` composes the editor, provides the React Flow context, and shares the canvas bounds reference with the palette. The layout component owns the toolbar and panel slots.

`WorkflowCanvas` passes controlled nodes and edges to React Flow and forwards its changesets to the store. The viewport remains in React Flow. The palette converts the canvas center from screen coordinates to flow coordinates when adding nodes. The custom node registry lives outside render and uses the same port definitions as connection validation.

The toolbar runs validation on demand. The result is tied to the graph revision and is replaced by a prompt to validate again after a node or connection is added or removed. Issue links select nodes through the store and center the viewport through React Flow.

## Application

`store/workflowStore.ts` owns the in-memory editor. The Zustand actions apply incoming changesets, edit node properties, validate and add connections, and remove incident edges when nodes are deleted. The single Start restriction was replaced with independent entry points. A draft can contain zero or more Starts, and any Start can be deleted.

Selection IDs are derived from the controlled nodes and edges. React Flow supplies selection, drag and measurement fields alongside document data, and the store keeps one working copy of each element. `replaceDocument` accepts a validated document for restore or import, replaces the graph and viewport in one update, and remounts the editor so selection and React Flow internals start fresh.

Changesets are read without mutation. The store accepts canvas selection, movement, measurement and deletion changes; element creation goes through explicit store actions. Node removal and incident-edge cleanup occur in one update. Graph revisions advance only on topology changes, so moving, selecting or renaming nodes does not invalidate validation results.

## Domain

`domain/connection.ts` defines the node types, compatible port IDs and connection rules. Before accepting a link, it searches from the proposed target for the proposed source using an adjacency map. Finding the source means the new link would close a cycle. The canvas uses this check for drag feedback, and the store reruns it against current state when committing a connection.

`domain/validation.ts` checks an entire workflow and returns deterministic issues with codes, severity, messages and optional node and edge IDs. Iterative depth-first search detects cycles across all components. Forward traversal from all Start nodes finds the union of reachable nodes. Reverse traversal from all End nodes identifies nodes with an exit path and checks each Condition output separately. Merge accepts several incoming links through one input handle and requires one outgoing link. It represents a visual junction. Both validators work on plain graph data and are covered by Vitest.

## Persistence and interchange

`model/workflowDocument.ts` projects the persistent fields from editor state, validates them with the version 1 Zod schema and checks identifiers and references. Schema validation determines whether a draft can be opened. The graph validator determines whether it is ready to run and is reused after import.

`workflowPersistence.ts` restores from LocalStorage before subscribing to the editor. It debounces document changes and flushes pending writes when the page is hidden. Selection, measurement and drag flags do not trigger writes. Save status comes from the persistence service and reflects the outcome of the actual write. A failed restore blocks automatic writes until the user authorizes a replacement.

`workflowFiles.ts` reads bounded UTF-8 JSON files and exports the same document format. The toolbar asks for confirmation after parsing and document validation, then replaces the graph and immediately runs workflow validation on the imported document.

## Editing history and clipboard

The store records bounded snapshots of the persisted node and edge fields. A snapshot can restore a node, its incident edges and its original IDs together. Canvas drag callbacks and inspector focus/blur open and finish edit transactions, so repeated drag updates or keystrokes create one history entry when the final graph changed. Undo and Redo retain the current viewport and clear selection. Only topology changes invalidate existing graph validation results. Import and restore clear the history, while Undo and Redo results flow through normal autosave.

The editor clipboard projects selected nodes and edges with both endpoints selected. Paste allocates fresh node and edge IDs, remaps endpoints, revalidates connections, and applies temporary selection and an increasing offset. The full paste is one edit. The canvas registers its own shortcut listener and removes it on unmount. Toolbar and shortcuts use the same store actions, and React Flow provides the MiniMap and multi-selection.

## Contextual editing

The header retains document controls, validation, Simulator, MiniMap, Help and language. The canvas hosts a single React Flow NodeToolbar for the selected node IDs. The toolbar stays at screen scale, uses the group's bounds for placement, and adjusts near canvas edges.

Canvas, node, selection and edge context events open one shared keyboard-accessible menu. Menu anchors and target IDs live in transient UI state. The menu dispatches existing commands and targeted delete or duplicate commands to Zustand. Contextual paste converts the pointer to flow coordinates. The canvas shortcut handler retains its existing commands and incremental paste offset. Ready, running and paused simulations disable document-changing commands in the interface and store.

See the [contextual editing decision](decisions/phase-7.5-contextual-editing.md).

## Condition editor and simulation input

Double-click selects one node and shows its properties when the simulator is unlocked. The simulator stays visible when it controls a locked run. Both sidebar views keep their session state across a toggle. The node summary formats the persisted reference value with the same operator symbols as the inspector.

The simulation input domain resolves literal names and legacy paths, derives form fields, and adds missing examples to the runtime object without changing existing values. The simulation store keeps one applied input. The JSON editor keeps a separate draft and applies it explicitly, while the form writes typed values directly. Document replacement starts a fresh input session. Undo and Redo restore Condition settings and refresh the form without removing prior session values. See the [Phase 7.6 decision record](decisions/phase-7.6-condition-ux-and-simulation-input.md).

## Simulation

`domain/simulation.ts` validates the graph and creates a detached snapshot of its execution-relevant data. Pure step transitions choose an outgoing handle, record an ordered event and advance the current node. End completes the run. Each Merge continues from its single outgoing edge. Invalid input or a broken path ends the run with a structured error. Execution is bounded to 500 steps.

`store/simulationStore.ts` owns the session independently of document state. Ready, running and paused sessions lock mutation commands in the workflow store. Canvas pan and zoom, export, and log navigation remain available. The editor clock schedules one timeout per running state and speed, cancels it on cleanup and checks session identity before advancing. The simulator panel and canvas derive their displays from the session. The engine runs entirely in the browser, with Action producing a log event.

React Flow 13 renders a marquee during Shift-drag, then a separate group rectangle for moving the selection. The group rectangle retains its pointer target with a transparent background and border. Individual selection and execution highlights are styled independently.

The design decisions are recorded in [Phase 7 simulation and selection](decisions/phase-7-simulation-and-selection.md).

## Localization and help

The presentation layer uses typed Korean and English dictionaries in `src/shared/i18n/`. Locale and onboarding preferences have their own Zustand store and storage keys. Switching languages updates the page language and translated labels without replacing the editor. The guide and first-run tour render in a native modal dialog and return focus to Help when closed.

Graph validation emits stable codes and parameters. The validation panel translates them on render, so an existing result can be read in either language. Document and storage errors also retain codes or structured details for presentation.

## Quality and delivery

Vitest covers the domain, document model, application state, storage and shortcut handling. V8 reports coverage for workflow domain, model, service and store modules. Playwright uses a fresh browser context per scenario and exercises the same production output that a static host serves.

CI uses Node.js 24 and the npm lockfile. Chromium failures retain screenshots and traces for inspection. The app has a single HTML entry point, and Vite resolves asset URLs for the configured base path. Root hosting only needs the `dist/` output. Drafts and editor preferences remain local to each browser origin.

## Tooling references

- [Vite runtime requirements](https://vite.dev/guide/)
- [Tailwind CSS Vite integration](https://tailwindcss.com/docs/installation/using-vite)
- [React Flow 13 integration](https://reactflow.dev/learn/troubleshooting/migrate-to-v13)
- [typescript-eslint compatibility](https://typescript-eslint.io/users/dependency-versions/)
- [Vitest requirements](https://vitest.dev/guide/)
- [Zod schema API](https://zod.dev/api)
