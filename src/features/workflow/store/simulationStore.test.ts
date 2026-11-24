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
