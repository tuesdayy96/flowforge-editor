import { useEffect } from 'react'
import { useSimulationStore } from '../store/simulationStore'

export function useSimulationClock(speed: number) {
  const simulation = useSimulationStore((state) => state.simulation)
  useEffect(() => {
    if (simulation.status !== 'running') return
    const timer = window.setTimeout(() => {
      const state = useSimulationStore.getState()
      if (state.simulation === simulation) state.step()
    }, speed)
    return () => window.clearTimeout(timer)
  }, [simulation, speed])
}
