# Workflow document format

The browser draft and exported files use UTF-8 JSON with the same versioned model.

| Field           | Version 1 value                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| `schemaVersion` | Number `1`                                                                           |
| `id`            | Document identifier                                                                  |
| `name`          | Workflow title, up to 120 characters                                                 |
| `nodes`         | Up to 500 entries with `id`, `type`, `position` and `data`                           |
| `edges`         | Up to 1,000 entries with `id`, `source`, `sourceHandle`, `target` and `targetHandle` |
| `viewport`      | Finite `x`, `y` and `zoom`, with zoom from 0.5 to 2                                  |

Node types are `start`, `action`, `condition` and `end`. Positions contain finite `x` and `y` numbers. Node data contains a `label` of up to 120 characters and a `description` of up to 4,000 characters. Condition connections retain their `true` and `false` output IDs.

Identifiers and handle names are 1–128 characters using ASCII letters, digits, dots, underscores, colons or hyphens. Node IDs and edge IDs must be unique within their respective arrays. Edge endpoints must reference existing nodes and their declared handles. The 1 MiB limit applies both to incoming JSON and the formatted document, so a draft that can be imported can also be exported.

The document excludes selection, dragging, measured dimensions and other React Flow internals. Restoring or importing applies the stored viewport and starts with an empty selection.

The version check rejects unsupported numeric schema versions before the version 1 schema is applied. Schema validation checks document structure and references. Workflow validation checks whether the graph is ready to run. Incomplete drafts can be stored, exported and imported.

LocalStorage uses `flowforge:workflow:current` for one draft per browser origin. Writes are debounced by 350 ms, with a flush on page hiding. If restoration fails, the app leaves the stored value in place until the user confirms a replacement.
