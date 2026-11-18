# Architecture

## Phase 1

`src/main.tsx` mounts React in strict mode. `src/app/App.tsx` composes the editor. The shared `components/layout/AppLayout.tsx` defines layout slots, while `features/workflow/components/` owns their contents.

`WorkflowCanvas` is the React Flow integration point. React Flow owns viewport interaction and renders an empty graph. The palette is a static reference, and the inspector displays its empty state. CSS custom properties centralize the light theme. Tailwind handles small layout utilities.

## Responsibilities as features are added

| Layer          | Responsibility                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Presentation   | Render panels and canvas, adapt React Flow types and turn UI events into editor actions.                                                      |
| Application    | Use Zustand to coordinate document edits and transient editor state. Keep viewport and selection separate from the workflow document.         |
| Domain         | Own workflow types and pure functions for connection rules, traversal, cycle detection and validation, independent of React and browser APIs. |
| Infrastructure | Validate workflow data at persistence and interchange boundaries. Introduce a versioned schema when adding LocalStorage and JSON support.     |

Introduce each layer's directories when its first feature lands.

## Tooling references

- [Vite runtime requirements](https://vite.dev/guide/)
- [Tailwind CSS Vite integration](https://tailwindcss.com/docs/installation/using-vite)
- [React Flow 13 integration](https://reactflow.dev/learn/troubleshooting/migrate-to-v13)
- [typescript-eslint compatibility](https://typescript-eslint.io/users/dependency-versions/)
