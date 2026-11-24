import { afterEach, expect, it } from 'vitest'
import {
  projectDocument,
  deserializeDocument,
  serializeDocument,
} from '../model/workflowDocument'
import { projectGraph } from '../model/workflowNode'
import { useSimulationStore } from './simulationStore'
import { useWorkflowStore } from './workflowStore'

afterEach(() => {
  useSimulationStore.getState().reset()
  useSimulationStore.getState().clearInput()
  useWorkflowStore.setState(useWorkflowStore.getInitialState())
})

it('controls one session and guards document changes without recording them', () => {
  const workflow = useWorkflowStore.getState()
  const [start] = workflow.nodes
  workflow.addNode('end', { x: 400, y: 100 })
  const end = useWorkflowStore.getState().nodes[1]
  workflow.addEdge({
    source: start.id,
    target: end.id,
    sourceHandle: 'out',
    targetHandle: 'in',
  })
  workflow.selectNode(start.id)
  workflow.copySelection()
  const before = useWorkflowStore.getState()
  const document = serializeDocument(projectDocument(before))
  const graph = projectGraph(before)
  const session = useSimulationStore.getState()
  const status = () => useSimulationStore.getState().simulation.status
  expect(status()).toBe('idle')
  session.start(graph, start.id, '{}')
  expect(status()).toBe('ready')
  session.start(graph, 'wrong', '{}')
  expect(status()).toBe('ready')
  session.run()
  expect(status()).toBe('running')
  session.pause()
  expect(status()).toBe('paused')
  session.step()
  session.run()
  workflow.undo()
  workflow.renameDocument('locked')
  workflow.updateNode(start.id, { label: 'locked' })
  workflow.duplicateSelection()
  workflow.removeNodes([start.id])
  workflow.removeEdge(before.edges[0].id)
  workflow.paste({ x: 0, y: 0 })
  workflow.addNode('start', { x: 0, y: 0 })
  workflow.replaceDocument(deserializeDocument(document), 'import')
  expect(useWorkflowStore.getState()).toBe(before)
  session.step()
  expect(status()).toBe('completed')
  expect(serializeDocument(projectDocument(useWorkflowStore.getState()))).toBe(
    document,
  )
  session.start(graph, start.id, '{}')
  session.run()
  session.stop()
  session.step()
  expect(status()).toBe('stopped')
  session.reset()
  expect(status()).toBe('idle')
  workflow.undo()
  expect(useWorkflowStore.getState().edges).toHaveLength(0)
})

it('seeds the applied input, keeps user values through condition changes, and freezes active runs', () => {
  const workflow = useWorkflowStore.getState()
  const [start] = workflow.nodes
  workflow.addNode('condition', { x: 300, y: 100 })
  workflow.addNode('end', { x: 500, y: 100 })
  const [, condition, end] = useWorkflowStore.getState().nodes
  workflow.addEdge({
    source: start.id,
    target: condition.id,
    sourceHandle: 'out',
    targetHandle: 'in',
  })
  for (const sourceHandle of ['true', 'false']) {
    workflow.addEdge({
      source: condition.id,
      target: end.id,
      sourceHandle,
      targetHandle: 'in',
    })
  }
  workflow.updateNode(condition.id, {
    condition: { field: '주문 금액', operator: 'gte', value: 100 },
  })
  const session = useSimulationStore.getState()
  const read = () => useSimulationStore.getState()
  session.syncFields(useWorkflowStore.getState().nodes)
  expect(read().input).toEqual({ '주문 금액': 100 })
  session.changeInput('주문 금액', 150)
  session.changeInput('주문 금액', '150')
  const accepted = read().input
  expect(session.applyInput('{')).toBe(false)
  expect(read().input).toBe(accepted)
  workflow.updateNode(condition.id, {
    condition: { field: '주문 금액', operator: 'gte', value: 200 },
  })
  session.syncFields(useWorkflowStore.getState().nodes)
  expect(read().input).toEqual({ '주문 금액': 150 })
  expect(session.applyInput('{"주문 금액":250,"order":{"extra":true}}')).toBe(
    true,
  )
  const graph = projectGraph(useWorkflowStore.getState())
  session.start(graph, start.id)
  expect(read().simulation.input).toEqual({
    '주문 금액': 250,
    order: { extra: true },
  })
  session.changeInput('주문 금액', 300)
  expect(session.applyInput('{"주문 금액":300}')).toBe(false)
  expect(read().input['주문 금액']).toBe(250)
  session.step()
  session.step()
  expect(read().simulation.log[1].result).toBe(true)
  session.reset()
  expect(read().input['주문 금액']).toBe(250)
})
