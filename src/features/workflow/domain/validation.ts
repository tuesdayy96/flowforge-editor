import {
  hasCompatiblePorts,
  workflowPorts,
  type ConnectionNode,
  type WorkflowConnection,
  type WorkflowNodeType,
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
  | 'branch-no-path-to-end'
  | 'missing-output'
  | 'cycle'

export interface ValidationIssue {
  code: ValidationCode
  severity: ValidationSeverity
  output?: string
  nodeType?: WorkflowNodeType
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
    details: Omit<ValidationIssue, 'code' | 'severity'> = {},
  ) {
    issues.push({ code, severity: 'error', ...details })
  }

  const nodesById = new Map<string, ConnectionNode>()
  for (const node of nodes) {
    if (nodesById.has(node.id)) {
      error('duplicate-node-id', {
        nodeId: node.id,
      })
    } else {
      nodesById.set(node.id, node)
    }
  }

  const startIds = nodes
    .filter((node) => node.type === 'start')
    .map((node) => node.id)
  const endIds = nodes
    .filter((node) => node.type === 'end')
    .map((node) => node.id)
  if (!startIds.length) error('start-count')
  if (!endIds.length) error('end-missing')

  const edgeIds = new Set<string>()
  const referencedEdges: ValidationEdge[] = []
  const traversableEdges: ValidationEdge[] = []
  const connectedOutputs = new Map<string, Map<string, ValidationEdge>>()

  for (const edge of edges) {
    if (edgeIds.has(edge.id)) {
      error('duplicate-edge-id', {
        edgeId: edge.id,
      })
    }
    edgeIds.add(edge.id)

    const source = nodesById.get(edge.source)
    const target = nodesById.get(edge.target)
    if (!source || !target) {
      error('missing-edge-node', {
        nodeId: source?.id ?? target?.id,
        edgeId: edge.id,
      })
      continue
    }
    referencedEdges.push(edge)
    if (!hasCompatiblePorts(edge, source, target)) {
      error('invalid-edge-port', {
        nodeId: source.id,
        edgeId: edge.id,
      })
      continue
    }

    const outputs =
      connectedOutputs.get(source.id) ?? new Map<string, ValidationEdge>()
    if (outputs.has(edge.sourceHandle)) {
      error('output-already-connected', {
        output: edge.sourceHandle,
        nodeId: source.id,
        edgeId: edge.id,
      })
      continue
    }
    outputs.set(edge.sourceHandle, edge)
    connectedOutputs.set(source.id, outputs)
    traversableEdges.push(edge)
  }

  const cycleNode = findCycleNode(
    nodesById.keys(),
    buildAdjacency(referencedEdges),
  )
  if (cycleNode !== undefined) {
    error('cycle', { nodeId: cycleNode })
  }

  const reachable = startIds.length
    ? reachableFrom(startIds, buildAdjacency(traversableEdges))
    : undefined
  const canReachEnd = endIds.length
    ? reachableFrom(endIds, buildAdjacency(traversableEdges, true))
    : undefined

  for (const node of nodesById.values()) {
    const location = { nodeId: node.id }
    if (reachable && !reachable.has(node.id)) {
      error('unreachable-node', location)
    }
    if (canReachEnd && !canReachEnd.has(node.id)) {
      error('no-path-to-end', location)
    }
    for (const output of workflowPorts[node.type].outputs) {
      const connection = connectedOutputs.get(node.id)?.get(output)
      if (!connection) {
        error('missing-output', { ...location, output, nodeType: node.type })
      } else if (
        node.type === 'condition' &&
        canReachEnd &&
        !canReachEnd.has(connection.target)
      ) {
        error('branch-no-path-to-end', {
          ...location,
          output,
          edgeId: connection.id,
        })
      }
    }
  }

  return { valid: !issues.some((issue) => issue.severity === 'error'), issues }
}
