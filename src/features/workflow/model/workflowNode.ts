import type { Edge, Node, XYPosition } from '@xyflow/react'
import type { WorkflowNodeType } from '../domain/connection'

import type { WorkflowCondition } from './workflowCondition'

export const nodeLabels = {
  start: 'Start',
  action: 'Action',
  condition: 'Condition',
  merge: 'Merge',
  end: 'End',
} satisfies Record<WorkflowNodeType, string>

export type WorkflowNodeData = {
  label: string
  description: string
  condition?: WorkflowCondition
}
export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType> & {
  type: WorkflowNodeType
}
export type WorkflowEdge = Edge

export function projectGraph({
  nodes,
  edges,
}: {
  nodes: readonly WorkflowNode[]
  edges: readonly WorkflowEdge[]
}) {
  return {
    nodes: nodes.map(
      ({
        id,
        type,
        position: { x, y },
        data: { label, description, condition },
      }) => ({
        id,
        type,
        position: { x, y },
        data: {
          label,
          description,
          ...(condition && { condition: { ...condition } }),
        },
      }),
    ),
    edges: edges.map(({ id, source, sourceHandle, target, targetHandle }) => ({
      id,
      source,
      sourceHandle,
      target,
      targetHandle,
    })),
  }
}

export type GraphSnapshot = ReturnType<typeof projectGraph>

export function createWorkflowNode(
  type: WorkflowNodeType,
  position: XYPosition,
): WorkflowNode {
  return {
    id: crypto.randomUUID(),
    type,
    position,
    data: { label: nodeLabels[type], description: '' },
  }
}
