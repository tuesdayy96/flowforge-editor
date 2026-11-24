import type { GraphSnapshot } from '../model/workflowNode'
import {
  isConditionValue,
  type WorkflowCondition,
} from '../model/workflowCondition'
import { validateWorkflow } from './validation'

type Input = Readonly<Record<string, unknown>>
export type SimulationError =
  | 'invalidGraph'
  | 'invalidStart'
  | 'invalidInput'
  | 'missingCondition'
  | 'conditionInput'
  | 'missingNode'
  | 'missingEdge'
  | 'stepLimit'
export type SimulationStatus =
  'idle' | 'ready' | 'running' | 'paused' | 'completed' | 'stopped' | 'error'
type GraphNode = GraphSnapshot['nodes'][number]
export interface SimulationEvent {
  step: number
  node: GraphNode
  result?: boolean
  error?: SimulationError
}
export interface SimulationState {
  status: SimulationStatus
  startId?: string
  currentNodeId?: string
  visitedNodeIds: readonly string[]
  traversedEdgeIds: readonly string[]
  log: readonly SimulationEvent[]
  error?: SimulationError
  snapshot?: GraphSnapshot
  input?: Input
}

export const emptySimulation: SimulationState = {
  status: 'idle',
  visitedNodeIds: [],
  traversedEdgeIds: [],
  log: [],
}

export function isSimulationActive(status: SimulationStatus) {
  return status === 'ready' || status === 'running' || status === 'paused'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateSimulationInput(text: string): Input | undefined {
  try {
    const input: unknown = JSON.parse(text)
    return isObject(input) ? input : undefined
  } catch {
    return undefined
  }
}

export function createSimulation(
  graph: GraphSnapshot,
  startId: string,
  inputText: string,
): SimulationState {
  const initial = { ...emptySimulation, startId }
  if (!graph.nodes.some((node) => node.id === startId && node.type === 'start'))
    return { ...initial, status: 'error', error: 'invalidStart' }
  if (!validateWorkflow(graph.nodes, graph.edges).valid)
    return { ...initial, status: 'error', error: 'invalidGraph' }
  const input = validateSimulationInput(inputText)
  if (!input) return { ...initial, status: 'error', error: 'invalidInput' }
  return {
    ...initial,
    status: 'ready',
    currentNodeId: startId,
    snapshot: structuredClone(graph),
    input,
  }
}

export function evaluateCondition(
  condition: WorkflowCondition,
  input: Input,
): boolean | undefined {
  let actual: unknown = input
  for (const key of condition.field.split('.')) {
    if (!key || !isObject(actual) || !Object.hasOwn(actual, key)) return
    actual = actual[key]
  }
  const { operator, value } = condition
  if (!isConditionValue(actual) || typeof actual !== typeof value) return
  if (operator === 'eq') return actual === value
  if (operator === 'neq') return actual !== value
  if (typeof actual !== 'number' || typeof value !== 'number') return
  switch (operator) {
    case 'gt':
      return actual > value
    case 'gte':
      return actual >= value
    case 'lt':
      return actual < value
    case 'lte':
      return actual <= value
  }
}

export function stepSimulation(
  state: SimulationState,
  maxSteps = 500,
): SimulationState {
  const { snapshot, input, currentNodeId } = state
  if (!isSimulationActive(state.status) || !snapshot || !input) return state
  const node = snapshot.nodes.find((item) => item.id === currentNodeId)
  const step = state.log.length + 1
  function fail(error: SimulationError, result?: boolean): SimulationState {
    return {
      ...state,
      status: 'error',
      error,
      log: node ? [...state.log, { step, node, result, error }] : state.log,
    }
  }
  if (step > maxSteps) return fail('stepLimit')
  if (!node) return fail('missingNode')

  let result: boolean | undefined
  if (node.type === 'condition') {
    if (!node.data.condition) return fail('missingCondition')
    result = evaluateCondition(node.data.condition, input)
    if (result === undefined) return fail('conditionInput')
  }

  const executed = {
    ...state,
    log: [...state.log, { step, node, result }],
    visitedNodeIds: [...state.visitedNodeIds, node.id],
  }
  if (node.type === 'end')
    return { ...executed, status: 'completed', currentNodeId: undefined }
  const handle = result === undefined ? 'out' : String(result)
  const edge = snapshot.edges.find(
    (item) => item.source === node.id && item.sourceHandle === handle,
  )
  if (!edge) return fail('missingEdge', result)
  if (!snapshot.nodes.some((item) => item.id === edge.target))
    return fail('missingNode', result)
  return {
    ...executed,
    currentNodeId: edge.target,
    traversedEdgeIds: [...state.traversedEdgeIds, edge.id],
  }
}
