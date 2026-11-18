import { useId } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { DOCUMENT_LIMITS } from '../model/workflowDocument'
import { nodeLabels, type WorkflowNode } from '../model/workflowNode'
import { selectSelectedNodeIds, useWorkflowStore } from '../store/workflowStore'

type EditableNode = Pick<WorkflowNode, 'id' | 'type' | 'data'>

function NodeProperties({ node }: { node: EditableNode }) {
  const id = useId()
  const updateNode = useWorkflowStore((state) => state.updateNode)
  const beginEdit = useWorkflowStore((state) => state.beginEdit)
  const finishEdit = useWorkflowStore((state) => state.finishEdit)

  return (
    <div className="inspector-fields">
      <dl>
        <dt>Node type</dt>
        <dd>{nodeLabels[node.type]}</dd>
        <dt>Node ID</dt>
        <dd className="inspector-node-id">{node.id}</dd>
      </dl>
      <label htmlFor={`${id}-label`}>Label</label>
      <input
        id={`${id}-label`}
        maxLength={DOCUMENT_LIMITS.label}
        value={node.data.label}
        onFocus={() => beginEdit('property')}
        onBlur={() => finishEdit('property')}
        onChange={(event) => updateNode(node.id, { label: event.target.value })}
      />
      <label htmlFor={`${id}-description`}>Description</label>
      <textarea
        id={`${id}-description`}
        maxLength={DOCUMENT_LIMITS.description}
        rows={4}
        value={node.data.description}
        onFocus={() => beginEdit('property')}
        onBlur={() => finishEdit('property')}
        onChange={(event) =>
          updateNode(node.id, { description: event.target.value })
        }
      />
    </div>
  )
}

export function PropertyInspector() {
  const selectedNodeIds = useWorkflowStore(useShallow(selectSelectedNodeIds))
  const node = useWorkflowStore(
    useShallow(({ nodes }) => {
      if (selectedNodeIds.length !== 1) return
      const selected = nodes.find((item) => item.id === selectedNodeIds[0])
      if (selected)
        return { id: selected.id, type: selected.type, data: selected.data }
    }),
  )

  return (
    <aside className="panel inspector" aria-labelledby="inspector-title">
      <div className="panel-heading">
        <h2 id="inspector-title">Properties</h2>
      </div>
      {node ? (
        <NodeProperties key={node.id} node={node} />
      ) : (
        <div className="inspector-empty">
          <h3>
            {selectedNodeIds.length > 1
              ? `${selectedNodeIds.length} nodes selected`
              : 'No node selected'}
          </h3>
          <p>Select one node to edit its properties.</p>
        </div>
      )}
    </aside>
  )
}
