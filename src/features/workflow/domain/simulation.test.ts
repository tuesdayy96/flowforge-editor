import { describe, expect, it } from 'vitest'
import type { GraphSnapshot } from '../model/workflowNode'
import {
  createSimulation,
  evaluateCondition,
  stepSimulation,
  validateSimulationInput,
} from './simulation'

export function graph(): GraphSnapshot {
  return {
    nodes: (['start', 'action', 'condition', 'merge', 'end'] as const).map(
      (type) => ({
        id: type,
        type,
        position: { x: 0, y: 0 },
        data: {
          label: type,
          description: '',
          ...(type === 'condition' && {
            condition: {
              field: 'order.amount',
              operator: 'gte' as const,
              value: 100,
            },
          }),
        },
      }),
    ),
    edges: [
      ['start', 'action', 'out'],
      ['action', 'condition', 'out'],
      ['condition', 'merge', 'true'],
      ['condition', 'merge', 'false'],
      ['merge', 'end', 'out'],
    ].map(([source, target, sourceHandle]) => ({
      id: source + sourceHandle,
      source,
      target,
      sourceHandle,
      targetHandle: 'in',
    })),
  }
}

describe('simulation engine', () => {
  it.each([
    [150, true],
    [50, false],
  ])('executes the selected branch for %s', (amount, result) => {
    const document = graph()
    const original = structuredClone(document)
    function run() {
      let simulation = createSimulation(
        document,
        'start',
        JSON.stringify({ order: { amount } }),
      )
      expect(simulation).toMatchObject({
        status: 'ready',
        currentNodeId: 'start',
      })
      for (let step = 0; step < 5; step++)
        simulation = stepSimulation(simulation)
      return simulation
    }
    const completed = run()
    expect(completed.status).toBe('completed')
    expect(completed.log.map(({ node }) => node.type)).toEqual([
      'start',
      'action',
      'condition',
      'merge',
      'end',
    ])
    expect(completed.log[2].result).toBe(result)
    expect(completed.traversedEdgeIds).toContain('condition' + String(result))
    expect(completed).toEqual(run())
    expect(document).toEqual(original)
  })

  it('selects exactly one Start and rejects an unknown Start', () => {
    const document = graph()
    document.nodes.push({ ...document.nodes[0], id: 'second' })
    document.edges.push({
      ...document.edges[0],
      id: 'second-out',
      source: 'second',
    })
    const state = stepSimulation(createSimulation(document, 'second', '{}'))
    expect(state.visitedNodeIds).toEqual(['second'])
    expect(state.traversedEdgeIds).toEqual(['second-out'])
    expect(createSimulation(document, 'invalid', '{}').error).toBe(
      'invalidStart',
    )
  })

  it('handles input and graph errors, missing runtime members and the step limit', () => {
    const document = graph()
    expect(
      createSimulation({ ...document, edges: [] }, 'start', '{}').error,
    ).toBe('invalidGraph')
    expect(createSimulation(document, 'start', '[]').error).toBe('invalidInput')
    const ready = createSimulation(document, 'start', '{}')
    const atCondition = stepSimulation(stepSimulation(ready))
    expect(stepSimulation(atCondition).error).toBe('conditionInput')
    expect(stepSimulation(ready, 0).error).toBe('stepLimit')
    expect(stepSimulation({ ...ready, currentNodeId: 'missing' }).error).toBe(
      'missingNode',
    )
    expect(
      stepSimulation({ ...ready, snapshot: { ...document, edges: [] } }).error,
    ).toBe('missingEdge')
    document.edges.length = 0
    expect(stepSimulation(ready).currentNodeId).toBe('action')
  })

  it('compares only supported values and own input properties', () => {
    expect(validateSimulationInput('{')).toBeUndefined()
    expect(
      evaluateCondition(
        { field: 'name', operator: 'eq', value: 'yes' },
        { name: 'yes' },
      ),
    ).toBe(true)
    expect(
      evaluateCondition(
        { field: 'flag', operator: 'neq', value: false },
        { flag: true },
      ),
    ).toBe(true)
    expect(
      evaluateCondition(
        { field: 'amount', operator: 'gt', value: 1 },
        { amount: '2' },
      ),
    ).toBeUndefined()
    expect(
      evaluateCondition(
        { field: 'constructor', operator: 'eq', value: 'constructor' },
        {},
      ),
    ).toBeUndefined()
  })
})
