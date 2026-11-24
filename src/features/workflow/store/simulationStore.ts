import { create } from 'zustand'
import {
  createSimulation,
  emptySimulation,
  isSimulationActive,
  stepSimulation,
  type SimulationState,
} from '../domain/simulation'
import {
  addMissingInputFields,
  collectSimulationFields,
  lookupInput,
  validateSimulationInput,
  writeInputValue,
  type SimulationInput,
  type SimulationField,
} from '../domain/simulationInput'
import {
  isConditionValue,
  type ConditionValue,
} from '../model/workflowCondition'
import type { GraphSnapshot } from '../model/workflowNode'

interface SimulationSession {
  simulation: SimulationState
  input: SimulationInput
  fields: SimulationField[]
  syncFields: (nodes: readonly GraphSnapshot['nodes'][number][]) => void
  changeInput: (name: string, value: ConditionValue) => void
  applyInput: (text: string) => boolean
  clearInput: () => void
  start: (graph: GraphSnapshot, id: string, input?: string) => void
  step: () => void
  run: () => void
  pause: () => void
  stop: () => void
  reset: () => void
}

export const useSimulationStore = create<SimulationSession>()((set, get) => ({
  simulation: emptySimulation,
  input: {},
  fields: [],
  syncFields: (nodes) =>
    set((state) => {
      const fields = collectSimulationFields(nodes)
      if (JSON.stringify(fields) === JSON.stringify(state.fields)) return state
      return { fields, input: addMissingInputFields(state.input, fields) }
    }),
  changeInput: (name, value) =>
    set((state) => {
      const field = state.fields.find((item) => item.name === name)
      if (
        isSimulationActive(state.simulation.status) ||
        !field ||
        field.conflict ||
        typeof value !== field.type ||
        !isConditionValue(value)
      )
        return state
      const previous = lookupInput(state.input, field.path)
      if (
        previous.kind === 'blocked' ||
        (previous.kind === 'found' && !isConditionValue(previous.value))
      )
        return state
      const input = writeInputValue(state.input, field.path, value)
      return input === state.input ? state : { input }
    }),
  applyInput: (text) => {
    if (isSimulationActive(get().simulation.status)) return false
    const input = validateSimulationInput(text)
    if (!input) return false
    set((state) => ({ input: addMissingInputFields(input, state.fields) }))
    return true
  },
  clearInput: () => set({ input: {}, fields: [] }),
  start: (graph, id, input) =>
    set((state) =>
      isSimulationActive(state.simulation.status)
        ? state
        : {
            simulation: createSimulation(
              graph,
              id,
              input ?? JSON.stringify(state.input),
            ),
          },
    ),
  step: () =>
    set(({ simulation }) => ({ simulation: stepSimulation(simulation) })),
  run: () =>
    set((state) => {
      const { simulation } = state
      return simulation.status === 'ready' || simulation.status === 'paused'
        ? { simulation: { ...simulation, status: 'running' } }
        : state
    }),
  pause: () =>
    set((state) =>
      state.simulation.status === 'running'
        ? { simulation: { ...state.simulation, status: 'paused' } }
        : state,
    ),
  stop: () =>
    set((state) =>
      isSimulationActive(state.simulation.status)
        ? {
            simulation: {
              ...state.simulation,
              status: 'stopped',
              currentNodeId: undefined,
            },
          }
        : state,
    ),
  reset: () => set({ simulation: emptySimulation }),
}))

export const selectSimulationLocked = ({ simulation }: SimulationSession) =>
  isSimulationActive(simulation.status)
export const isEditingLocked = () =>
  selectSimulationLocked(useSimulationStore.getState())
