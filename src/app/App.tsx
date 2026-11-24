import { useEffect, useRef, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { NodePalette } from '@/features/workflow/components/NodePalette'
import { PropertyInspector } from '@/features/workflow/components/PropertyInspector'
import { WorkflowCanvas } from '@/features/workflow/components/WorkflowCanvas'
import {
  type MiniMapControls,
  WorkflowToolbar,
} from '@/features/workflow/components/WorkflowToolbar'
import type { WorkflowPersistence } from '@/features/workflow/services/workflowPersistence'
import { useWorkflowStore } from '@/features/workflow/store/workflowStore'

import { Simulator } from '@/features/workflow/components/Simulator'
import { useSimulationStore } from '@/features/workflow/store/simulationStore'
import { useSimulationClock } from '@/features/workflow/hooks/useSimulationClock'

export function App({ persistence }: { persistence: WorkflowPersistence }) {
  const generation = useWorkflowStore((state) => state.documentGeneration)
  const [showMiniMap, setShowMiniMap] = useState(true)
  return (
    <Editor
      key={generation}
      persistence={persistence}
      showMiniMap={showMiniMap}
      toggleMiniMap={() => setShowMiniMap((visible) => !visible)}
    />
  )
}

function Editor({
  persistence,
  showMiniMap,
  toggleMiniMap,
}: { persistence: WorkflowPersistence } & MiniMapControls) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const inspectorRef = useRef<HTMLDivElement>(null)
  const [showSimulator, setShowSimulator] = useState(false)
  const [speed, setSpeed] = useState(500)
  useSimulationClock(speed)
  useEffect(() => {
    const { syncFields } = useSimulationStore.getState()
    syncFields(useWorkflowStore.getState().nodes)
    return useWorkflowStore.subscribe((next, previous) => {
      if (next.nodes === previous.nodes) return
      if (
        next.nodes.length !== previous.nodes.length ||
        next.nodes.some(
          (node, index) =>
            node.data.condition !== previous.nodes[index].data.condition,
        )
      )
        syncFields(next.nodes)
    })
  }, [])

  return (
    <ReactFlowProvider>
      <AppLayout
        toolbar={
          <WorkflowToolbar
            persistence={persistence}
            showMiniMap={showMiniMap}
            toggleMiniMap={toggleMiniMap}
            showSimulator={showSimulator}
            toggleSimulator={() => setShowSimulator((visible) => !visible)}
          />
        }
        palette={<NodePalette surfaceRef={surfaceRef} />}
        canvas={
          <WorkflowCanvas
            surfaceRef={surfaceRef}
            showMiniMap={showMiniMap}
            onEditProperties={() => {
              setShowSimulator(false)
              requestAnimationFrame(() =>
                inspectorRef.current
                  ?.querySelector<HTMLInputElement>('input')
                  ?.focus(),
              )
            }}
          />
        }
        inspector={
          <div className="editor-sidebar">
            <div ref={inspectorRef} hidden={showSimulator}>
              <PropertyInspector />
            </div>
            <aside
              id="workflow-simulator"
              className="panel inspector"
              hidden={!showSimulator}
            >
              <Simulator speed={speed} setSpeed={setSpeed} />
            </aside>
          </div>
        }
      />
    </ReactFlowProvider>
  )
}
