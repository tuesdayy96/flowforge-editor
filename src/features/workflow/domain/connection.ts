import { buildAdjacency, reachableFrom } from './graph'

export const workflowPorts = {
  start: { input: null, outputs: ['out'] },
  action: { input: 'in', outputs: ['out'] },
  condition: { input: 'in', outputs: ['true', 'false'] },
  end: { input: 'in', outputs: [] },
} satisfies Record<string, { input: string | null; outputs: readonly string[] }>

export type WorkflowNodeType = keyof typeof workflowPorts

export interface WorkflowConnection {
  source: string
  sourceHandle?: string | null
  target: string
  targetHandle?: string | null
}

export interface ConnectionNode {
  id: string
  type: WorkflowNodeType
}

export function hasCompatiblePorts(
  connection: WorkflowConnection,
  source: ConnectionNode,
  target: ConnectionNode,
): connection is WorkflowConnection & {
  sourceHandle: string
  targetHandle: string
} {
  const { sourceHandle, targetHandle } = connection
  return (
    source.id !== target.id &&
    Boolean(sourceHandle && targetHandle) &&
    workflowPorts[source.type].outputs.some(
      (handle) => handle === sourceHandle,
    ) &&
    workflowPorts[target.type].input === targetHandle
  )
}

export function canConnect(
  connection: WorkflowConnection,
  nodes: readonly ConnectionNode[],
  edges: readonly WorkflowConnection[],
): boolean {
  const { source, sourceHandle, target } = connection

  const sourceNode = nodes.find((node) => node.id === source)
  const targetNode = nodes.find((node) => node.id === target)
  if (
    !sourceNode ||
    !targetNode ||
    !hasCompatiblePorts(connection, sourceNode, targetNode)
  )
    return false

  // A previously used output also covers the duplicate-edge case.
  if (
    edges.some(
      (edge) => edge.source === source && edge.sourceHandle === sourceHandle,
    )
  )
    return false

  return !reachableFrom([target], buildAdjacency(edges)).has(source)
}
