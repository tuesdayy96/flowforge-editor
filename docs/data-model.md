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

Node types are `start`, `action`, `condition`, `merge` and `end`. Positions contain finite `x` and `y` numbers. Node data contains a `label` of up to 120 characters and a `description` of up to 4,000 characters. Condition connections retain their `true` and `false` output IDs. Merge accepts multiple incoming edges at `in` and up to one outgoing edge at `out`. It represents a visual junction with no execution synchronization semantics.

Condition nodes can include the optional `data.condition` object with a dot-separated `field` path, an `operator` (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`), and a `value` that is a JSON string, finite number or boolean. The field path can contain up to 256 characters. String comparison values can contain up to 4,000 characters. Equality requires matching types, and ordered comparisons require numbers. Condition nodes without this object load as before and require a comparison before the simulator can execute them.

A draft can have any number of Starts. A valid workflow has at least one Start, and every node must be reachable from at least one of them. Existing version 1 documents use the same fields, handles and storage key and can be opened directly.

Identifiers and handle names are 1–128 characters using ASCII letters, digits, dots, underscores, colons or hyphens. Node IDs and edge IDs must be unique within their respective arrays. Edge endpoints must reference existing nodes and their declared handles. The 1 MiB limit applies both to incoming JSON and the formatted document, so a draft that can be imported can also be exported.

The document excludes selection, dragging, measured dimensions, React Flow internals, simulator input, execution status and logs. Condition comparison settings are document properties and participate in graph history, clipboard operations and JSON interchange. Restoring or importing applies the stored viewport and starts with an empty selection.

History and clipboard data stay in memory. History snapshots use the document's node and edge fields and leave the current viewport and document metadata in place. Pasted nodes and edges receive new IDs, and edge endpoints are remapped to the new node IDs.

Language and tour completion are browser preferences stored under `flowforge:locale` and `flowforge:onboarding:complete`. The JSON document omits both. Node type names and handle IDs are stable across languages, and user-entered labels and descriptions are preserved.

The version check rejects unsupported numeric schema versions before the version 1 schema is applied. Schema validation checks document structure and references. Workflow validation checks whether the graph is ready to run. Incomplete drafts can be stored, exported and imported.

LocalStorage uses `flowforge:workflow:current` for one draft per browser origin. Writes are debounced by 350 ms, with a flush on page hiding. If restoration fails, the app leaves the stored value in place until the user confirms a replacement.
