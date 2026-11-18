import { describe, expect, it } from 'vitest'
import { canConnect, type WorkflowConnection } from './connection'

const nodes = [
  { id: 'start', type: 'start' },
  { id: 'action', type: 'action' },
  { id: 'condition', type: 'condition' },
  { id: 'end', type: 'end' },
] as const

const connection: WorkflowConnection = {
  source: 'action',
  sourceHandle: 'out',
  target: 'condition',
  targetHandle: 'in',
}

describe('canConnect', () => {
  it('allows compatible ports on different nodes', () => {
    expect(canConnect(connection, nodes, [])).toBe(true)
    expect(
      canConnect(
        { ...connection, source: 'start', target: 'action' },
        nodes,
        [],
      ),
    ).toBe(true)
  })

  it.each([
    { source: 'missing' },
    { target: 'missing' },
    { sourceHandle: null },
    { sourceHandle: 'unknown' },
    { targetHandle: null },
    { targetHandle: 'unknown' },
    { target: 'action' },
    { target: 'start' },
    { source: 'end' },
    { source: 'condition', sourceHandle: 'out', target: 'end' },
  ] satisfies Partial<WorkflowConnection>[])(
    'rejects invalid endpoints %j',
    (overrides) => {
      expect(canConnect({ ...connection, ...overrides }, nodes, [])).toBe(false)
    },
  )

  it('rejects duplicate edges and any second connection from an occupied output', () => {
    expect(canConnect(connection, nodes, [connection])).toBe(false)
    expect(
      canConnect({ ...connection, target: 'end' }, nodes, [connection]),
    ).toBe(false)
  })

  it('allows both Condition outputs to connect independently to the same input', () => {
    const branch = {
      ...connection,
      source: 'condition',
      target: 'end',
      sourceHandle: 'true',
    }
    expect(canConnect(branch, nodes, [])).toBe(true)
    expect(
      canConnect({ ...branch, sourceHandle: 'false' }, nodes, [branch]),
    ).toBe(true)
    expect(canConnect({ ...branch, target: 'action' }, nodes, [branch])).toBe(
      false,
    )
  })

  it('rejects a connection that closes a cycle', () => {
    const returnEdge = {
      ...connection,
      source: 'condition',
      sourceHandle: 'true',
      target: 'action',
    }
    expect(canConnect(returnEdge, nodes, [connection])).toBe(false)
  })

  it('detects indirect cycles without rejecting convergent branches', () => {
    const extraNodes = [...nodes, { id: 'next', type: 'action' as const }]
    const branch = {
      ...connection,
      source: 'condition',
      sourceHandle: 'true',
      target: 'next',
    }
    const back = { ...connection, source: 'next', target: 'action' }
    expect(canConnect(back, extraNodes, [connection, branch])).toBe(false)
    const forward = { ...back, target: 'end' }
    expect(canConnect(forward, extraNodes, [connection, branch])).toBe(true)
  })
})
