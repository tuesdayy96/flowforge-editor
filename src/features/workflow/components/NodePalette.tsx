import type { RefObject } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { WorkflowNodeType } from '../domain/connection'
import { nodeLabels } from '../model/workflowNode'
import { useWorkflowStore } from '../store/workflowStore'

const paletteItems = [
  { type: 'start', symbol: '▷', description: 'Entry point' },
  { type: 'action', symbol: '↗', description: 'Perform a task' },
  { type: 'condition', symbol: '◇', description: 'Branch by a rule' },
  { type: 'merge', symbol: '⇥', description: 'Bring paths together' },
  { type: 'end', symbol: '□', description: 'Exit point' },
] satisfies Array<{
  type: WorkflowNodeType
  symbol: string
  description: string
}>

export function NodePalette({
  surfaceRef,
}: {
  surfaceRef: RefObject<HTMLDivElement | null>
}) {
  const { screenToFlowPosition } = useReactFlow()
  const addNode = useWorkflowStore((state) => state.addNode)

  function addAtCenter(type: WorkflowNodeType) {
    const bounds = surfaceRef.current?.getBoundingClientRect()
    if (!bounds) return

    addNode(
      type,
      screenToFlowPosition({
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      }),
    )
  }

  return (
    <aside className="panel palette" aria-labelledby="palette-title">
      <div className="panel-heading">
        <h2 id="palette-title">Node palette</h2>
        <p>Add a node at the center of the canvas.</p>
      </div>
      <ul className="node-list">
        {paletteItems.map(({ type, symbol, description }) => (
          <li key={type}>
            <button
              className="node-card flex w-full items-center gap-3 text-left"
              type="button"
              aria-label={`Add ${nodeLabels[type]} node`}
              onClick={() => addAtCenter(type)}
            >
              <span
                className={`node-symbol node-symbol--${type}`}
                aria-hidden="true"
              >
                {symbol}
              </span>
              <span>
                <span className="block font-semibold">{nodeLabels[type]}</span>
                <span className="node-card-description">{description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
