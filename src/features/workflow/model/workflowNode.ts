import type { Edge, Node, XYPosition } from '@xyflow/react'
import type { WorkflowNodeType } from '../domain/connection'

export const nodeLabels = {
  start: 'Start',
  action: 'Action',
  condition: 'Condition',
  end: 'End',
} satisfies Record<WorkflowNodeType, string>

export type WorkflowNodeData = { label: string; description: string }
export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType> & {
  type: WorkflowNodeType
}
export type WorkflowEdge = Edge
export type AddableNodeType = Exclude<WorkflowNodeType, 'start'>

export function createWorkflowNode(
  type: WorkflowNodeType,
  position: XYPosition,
): WorkflowNode {
  return {
    id: crypto.randomUUID(),
    type,
    position,
    data: { label: nodeLabels[type], description: '' },
    deletable: type !== 'start',
  }
}
