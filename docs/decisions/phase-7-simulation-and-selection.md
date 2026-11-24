# Phase 7 simulation and selection

## One Start per run

Multiple Starts represent independent entry points. Selecting one produces a reproducible sequence for a given graph and input. A Merge passes through immediately when that path reaches it. Parallel branches and synchronized joins would require tracking multiple active execution paths.

## Pure execution and separate state

The engine consumes a graph snapshot and produces deterministic state transitions. The application owns scheduling and presentation, which lets tests advance a run without relying on wall-clock time. Execution metadata lives in its own in-memory store so that running the simulator leaves document history, autosave and JSON exports focused on editing data. The simulator evaluates control flow in the browser. Action execution consists of recording an event.

## Keep the group drag target

React Flow renders separate elements for the drag marquee and the post-drag group bounds. Transparent group bounds retain dragging while individual selection highlights identify which nodes belong to the selection. The marquee remains visible while choosing nodes.
