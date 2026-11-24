# Phase 7.6 Condition editing and simulation input

The inspector stores the item name, operator code and typed reference value in the existing optional Condition object. The operator codes remain stable, and the inspector and node summary share one symbol table. Only presentation formats numeric grouping and quoted strings.

Names without an ASCII dot address one key. New names are trimmed at the outside and retain their original spelling, internal spaces and punctuation. ASCII dots keep their existing meaning as exact nested object segments. Empty segments, control characters and reserved prototype keys are rejected. Arrays can exist in other JSON data but are unavailable for path traversal. A flat JSON key containing a dot is retained as extra data and stays distinct from a nested path.

The simulator derives the form and example values from the current Condition settings. A shared field appears once. Conflicting types or prefix paths are shown as warnings and are skipped when adding examples. Existing values take precedence, including blocking ancestors and values of different types. A changed comparison, removed field or Undo/Redo retains the applied input for the session. Explicitly applying JSON replaces the applied input and adds any missing compatible examples. Invalid JSON and unapplied drafts leave the applied object intact.

Document schema version 1 is preserved. Import and reload derive a fresh input session from the stored Condition settings. Session input, examples and drafts are excluded from document export and undo history. Starting a simulation captures the applied input and a graph snapshot.

Double-click selects the node and opens its properties when editing is available. Ready, running and paused sessions retain the simulator controls. Switching panes or locale retains the active input and run result.
