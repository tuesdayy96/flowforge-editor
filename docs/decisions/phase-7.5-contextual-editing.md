# Phase 7.5 contextual editing

The header keeps workflow-wide controls in reach. Moving edit commands to the canvas puts selection-specific actions beside their targets. Import and export remain separate document controls.

React Flow 13 NodeToolbar accepts an array of node IDs and positions one screen-scale toolbar from the group's bounds. Single-node menus include Edit properties. Group menus act on the selected IDs captured at open time. CSS keeps the Phase 7 group outline transparent, and the toolbar adjusts at the canvas edges.

React Flow events determine the target and open a shared menu. Menu positioning, keyboard navigation and focus are presentation concerns. Zustand owns mutation guards and records history. Duplicate shares the graph-copy and ID-remapping path with paste, retains the clipboard and records the whole operation once. Contextual paste uses a flow coordinate from the pointer. Canvas shortcuts retain their existing scope and the incremental keyboard paste offset.

Ready, running and paused sessions lock edits in both the command UI and the store. Read-only copy, selection, and viewport controls remain available during a simulation.
