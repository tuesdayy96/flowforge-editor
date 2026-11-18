import {
  hasCompatiblePorts,
  workflowPorts,
  type ConnectionNode,
  type WorkflowConnection,
} from './connection'
import { buildAdjacency, findCycleNode, reachableFrom } from './graph'

export type ValidationSeverity = 'error' | 'warning'

export type ValidationCode =
  | 'start-count'
  | 'end-missing'
  | 'duplicate-node-id'
  | 'duplicate-edge-id'
  | 'missing-edge-node'
  | 'invalid-edge-port'
  | 'output-already-connected'
  | 'unreachable-node'
  | 'no-path-to-end'
  | 'missing-output'
  | 'cycle'

export interface ValidationIssue {
  code: ValidationCode
  severity: ValidationSeverity
  message: string
  nodeId?: string
  edgeId?: string
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}

type ValidationEdge = WorkflowConnection & { id: string }

export function validateWorkflow(
  nodes: readonly ConnectionNode[],
  edges: readonly ValidationEdge[],
): ValidationResult {
  const issues: ValidationIssue[] = []
  function error(
    code: ValidationCode,
    message: string,
    target: Pick<ValidationIssue, 'nodeId' | 'edgeId'> = {},
  ) {
    issues.push({ code, severity: 'error', message, ...target })
  }

  const nodesById = new Map<string, ConnectionNode>()
  for (const node of nodes) {
    if (nodesById.has(node.id)) {
      error('duplicate-node-id', 'Each node must have a unique ID.', {
        nodeId: node.id,
      })
    } else {
      nodesById.set(node.id, node)
    }
  }

  const starts = nodes.filter((node) => node.type === 'start')
  const endIds = nodes
    .filter((node) => node.type === 'end')
    .map((node) => node.id)
  if (starts.length !== 1) {
    error('start-count', `Expected one Start node. Found ${starts.length}.`, {
      nodeId: starts[1]?.id,
    })
  }
  if (!endIds.length) error('end-missing', 'Add at least one End node.')

  const edgeIds = new Set<string>()
  const referencedEdges: ValidationEdge[] = []
  const traversableEdges: ValidationEdge[] = []
  const connectedOutputs = new Map<string, Set<string>>()

  for (const edge of edges) {
    if (edgeIds.has(edge.id)) {
      error('duplicate-edge-id', 'Each connection must have a unique ID.', {
        edgeId: edge.id,
      })
    }
    edgeIds.add(edge.id)

    const source = nodesById.get(edge.source)
    const target = nodesById.get(edge.target)
    if (!source || !target) {
      error(
        'missing-edge-node',
        'Remove the connection or restore its missing endpoint.',
        {
          nodeId: source?.id ?? target?.id,
          edgeId: edge.id,
        },
      )
      continue
    }
    referencedEdges.push(edge)
    if (!hasCompatiblePorts(edge, source, target)) {
      error(
        'invalid-edge-port',
        'Reconnect this edge from a valid output to a valid input.',
        {
          nodeId: source.id,
          edgeId: edge.id,
        },
      )
      continue
    }

    const outputs = connectedOutputs.get(source.id) ?? new Set<string>()
    if (outputs.has(edge.sourceHandle)) {
      error(
        'output-already-connected',
        `Keep only one connection on the “${edge.sourceHandle}” output.`,
        {
          nodeId: source.id,
          edgeId: edge.id,
        },
      )
      continue
    }
    outputs.add(edge.sourceHandle)
    connectedOutputs.set(source.id, outputs)
    traversableEdges.push(edge)
  }

  const cycleNode = findCycleNode(
    nodesById.keys(),
    buildAdjacency(referencedEdges),
  )
  if (cycleNode !== undefined) {
    error(
      'cycle',
      'Remove a connection in the cycle so the workflow can continue.',
      { nodeId: cycleNode },
    )
  }

  const reachable =
    starts.length === 1
      ? reachableFrom([starts[0].id], buildAdjacency(traversableEdges))
      : undefined
  const canReachEnd = endIds.length
    ? reachableFrom(endIds, buildAdjacency(traversableEdges, true))
    : undefined

  for (const node of nodesById.values()) {
    const location = { nodeId: node.id }
    if (reachable && !reachable.has(node.id)) {
      error(
        'unreachable-node',
        'Connect this node to a path from Start or remove it.',
        location,
      )
    }
    if (reachable?.has(node.id) && canReachEnd && !canReachEnd.has(node.id)) {
      error('no-path-to-end', 'Connect this path to an End node.', location)
    }
    for (const output of workflowPorts[node.type].outputs) {
      if (!connectedOutputs.get(node.id)?.has(output)) {
        error(
          'missing-output',
          node.type === 'condition'
            ? `Connect the ${output} branch.`
            : 'Connect this node’s output.',
          location,
        )
      }
    }
  }

  return { valid: !issues.some((issue) => issue.severity === 'error'), issues }
}
