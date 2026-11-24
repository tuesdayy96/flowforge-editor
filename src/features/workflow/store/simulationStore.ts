import { create } from 'zustand'
import {
  createSimulation,
  emptySimulation,
  isSimulationActive,
  stepSimulation,
  type SimulationState,
} from '../domain/simulation'
import type { GraphSnapshot } from '../model/workflowNode'

interface SimulationSession {
  simulation: SimulationState
  start: (graph: GraphSnapshot, id: string, input: string) => void
  step: () => void
  run: () => void
  pause: () => void
  stop: () => void
  reset: () => void
}

export const useSimulationStore = create<SimulationSession>()((set) => ({
  simulation: emptySimulation,
  start: (graph, id, input) =>
    set((state) =>
      isSimulationActive(state.simulation.status)
        ? state
        : { simulation: createSimulation(graph, id, input) },
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
