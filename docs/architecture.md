# Architecture

## Presentation

`src/main.tsx` mounts React in strict mode. `src/app/App.tsx` composes the editor, provides the React Flow context, and shares the canvas bounds reference with the palette. The layout component owns the toolbar and panel slots.

`WorkflowCanvas` passes controlled nodes and edges to React Flow and forwards its changesets to the store. The viewport remains in React Flow. The palette converts the canvas center from screen coordinates to flow coordinates when adding nodes. The custom node registry lives outside render and uses the same port definitions as connection validation.

The toolbar runs validation on demand. The result is tied to the graph revision and is replaced by a prompt to validate again after a node or connection is added or removed. Issue links select nodes through the store and center the viewport through React Flow.

## Application

`store/workflowStore.ts` owns the in-memory editor. The Zustand actions apply incoming changesets, edit node properties, validate and add connections, and remove incident edges when nodes are deleted. The initial Start node is protected from deletion.

Selection IDs are derived from the controlled nodes and edges. React Flow supplies selection, drag and measurement fields alongside document data, and the store keeps one working copy of each element. `replaceDocument` accepts a validated document for restore or import, replaces the graph and viewport in one update, and remounts the editor so selection and React Flow internals start fresh.

Changesets are read without mutation. The store accepts canvas selection, movement, measurement and deletion changes; element creation goes through explicit store actions. Node removal and incident-edge cleanup occur in one update. Graph revisions advance only on topology changes, so moving, selecting or renaming nodes does not invalidate validation results.

## Domain

`domain/connection.ts` defines the node types, compatible port IDs and connection rules. Before accepting a link, it searches from the proposed target for the proposed source using an adjacency map. Finding the source means the new link would close a cycle. The canvas uses this check for drag feedback, and the store reruns it against current state when committing a connection.

`domain/validation.ts` checks an entire workflow and returns deterministic issues with codes, severity, messages and optional node and edge IDs. Iterative depth-first search detects cycles across all components. Traversals from Start and back from the End nodes expose unreachable nodes and reachable nodes without a route to End. Port and output checks ensure that required branches are present. Both validators work on plain graph data and are covered by Vitest.

## Persistence and interchange

`model/workflowDocument.ts` projects the persistent fields from editor state, validates them with the version 1 Zod schema and checks identifiers and references. Schema validation determines whether a draft can be opened. The graph validator determines whether it is ready to run and is reused after import.

`workflowPersistence.ts` restores from LocalStorage before subscribing to the editor. It debounces document changes and flushes pending writes when the page is hidden. Selection, measurement and drag flags do not trigger writes. Save status comes from the persistence service and reflects the outcome of the actual write. A failed restore blocks automatic writes until the user authorizes a replacement.

`workflowFiles.ts` reads bounded UTF-8 JSON files and exports the same document format. The toolbar asks for confirmation after parsing and document validation, then replaces the graph and immediately runs workflow validation on the imported document.

## Later phases

Undo and redo can record editor commands while treating restore and import as document replacement boundaries. Save status and viewport tracking have separate responsibilities from command history.

## Tooling references

- [Vite runtime requirements](https://vite.dev/guide/)
- [Tailwind CSS Vite integration](https://tailwindcss.com/docs/installation/using-vite)
- [React Flow 13 integration](https://reactflow.dev/learn/troubleshooting/migrate-to-v13)
- [typescript-eslint compatibility](https://typescript-eslint.io/users/dependency-versions/)
- [Vitest requirements](https://vitest.dev/guide/)
- [Zod schema API](https://zod.dev/api)
