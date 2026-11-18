import { describe, expect, it } from 'vitest'
import type { ConnectionNode } from './connection'
import { validateWorkflow } from './validation'

const nodes = [
  { id: 's', type: 'start' },
  { id: 'a', type: 'action' },
  { id: 'c', type: 'condition' },
  { id: 'e', type: 'end' },
] satisfies ConnectionNode[]

function link(
  id: string,
  source: string,
  target: string,
  sourceHandle = 'out',
) {
  return { id, source, target, sourceHandle, targetHandle: 'in' }
}

const edges = [
  link('sa', 's', 'a'),
  link('ac', 'a', 'c'),
  link('ce-true', 'c', 'e', 'true'),
  link('ce-false', 'c', 'e', 'false'),
]

describe('validateWorkflow', () => {
  it('accepts a valid graph with branches converging on one End', () => {
    expect(validateWorkflow(nodes, edges)).toEqual({ valid: true, issues: [] })
  })

  it.each([
    ['missing Start', nodes.slice(1), 'start-count'],
    [
      'multiple Start nodes',
      [...nodes, { id: 'another-start', type: 'start' as const }],
      'start-count',
    ],
    ['missing End', nodes.slice(0, -1), 'end-missing'],
    ['duplicate node ID', [...nodes, nodes[1]], 'duplicate-node-id'],
  ] as const)('reports %s', (_name, candidateNodes, code) => {
    const result = validateWorkflow(candidateNodes, edges)
    expect(result.valid).toBe(false)
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code, severity: 'error' }),
    )
  })

  it('reports duplicate Edge IDs and missing endpoints by Edge ID', () => {
    const result = validateWorkflow(nodes, [
      ...edges,
      link('sa', 'a', 'missing'),
      link('missing-source', 'missing', 'e'),
    ])
    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'duplicate-edge-id', edgeId: 'sa' }),
        expect.objectContaining({
          code: 'missing-edge-node',
          edgeId: 'sa',
          nodeId: 'a',
        }),
        expect.objectContaining({
          code: 'missing-edge-node',
          edgeId: 'missing-source',
          nodeId: 'e',
        }),
      ]),
    )
  })

  it('reports isolated nodes and connected nodes that are unreachable from Start', () => {
    const extraNodes = [
      ...nodes,
      { id: 'isolated', type: 'action' },
      { id: 'detached', type: 'action' },
    ] satisfies ConnectionNode[]
    const result = validateWorkflow(extraNodes, [
      ...edges,
      link('de', 'detached', 'e'),
    ])
    expect(
      result.issues
        .filter((issue) => issue.code === 'unreachable-node')
        .map((issue) => issue.nodeId),
    ).toEqual(['isolated', 'detached'])
  })

  it('reports a missing Condition branch and required Action output', () => {
    const result = validateWorkflow(nodes, [edges[0], edges[2]])
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'missing-output',
          nodeId: 'c',
          message: 'Connect the false branch.',
        }),
        expect.objectContaining({ code: 'missing-output', nodeId: 'a' }),
      ]),
    )
  })

  it('flags a reachable dead branch even when the other branch ends correctly', () => {
    const extraNodes = [
      ...nodes,
      { id: 'dead', type: 'action' },
    ] satisfies ConnectionNode[]
    const result = validateWorkflow(extraNodes, [
      ...edges.slice(0, 3),
      link('cd', 'c', 'dead', 'false'),
    ])
    expect(result.valid).toBe(false)
    expect(
      result.issues
        .filter((issue) => issue.code === 'no-path-to-end')
        .map((issue) => issue.nodeId),
    ).toEqual(['dead'])
  })

  it('detects cycles even in disconnected parts and cycles with an exit', () => {
    const cycle = link('ca', 'c', 'a', 'false')
    const reachableCycle = validateWorkflow(nodes, [
      ...edges.slice(0, 3),
      cycle,
    ])
    const disconnectedCycle = validateWorkflow(nodes, [
      ...edges.slice(1, 3),
      cycle,
    ])
    for (const result of [reachableCycle, disconnectedCycle]) {
      expect(result.valid).toBe(false)
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: 'cycle', nodeId: 'a' }),
      )
    }
  })

  it('rejects invalid handles and a reused output in existing documents', () => {
    const result = validateWorkflow(nodes, [
      ...edges,
      link('wrong-port', 'c', 'e'),
      link('occupied', 'c', 'a', 'true'),
    ])
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'invalid-edge-port',
          edgeId: 'wrong-port',
        }),
        expect.objectContaining({
          code: 'output-already-connected',
          edgeId: 'occupied',
        }),
      ]),
    )
  })

  it('returns the same issues for the same input', () => {
    expect(validateWorkflow(nodes, [])).toEqual(validateWorkflow(nodes, []))
  })
})
