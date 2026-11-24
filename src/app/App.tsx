import { useRef, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { NodePalette } from '@/features/workflow/components/NodePalette'
import { PropertyInspector } from '@/features/workflow/components/PropertyInspector'
import { WorkflowCanvas } from '@/features/workflow/components/WorkflowCanvas'
import type { MiniMapControls } from '@/features/workflow/components/WorkflowEditorActions'
import { WorkflowToolbar } from '@/features/workflow/components/WorkflowToolbar'
import type { WorkflowPersistence } from '@/features/workflow/services/workflowPersistence'
import { useWorkflowStore } from '@/features/workflow/store/workflowStore'

import { Simulator } from '@/features/workflow/components/Simulator'
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
  const [showSimulator, setShowSimulator] = useState(false)
  const [speed, setSpeed] = useState(500)
  useSimulationClock(speed)

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
          <WorkflowCanvas surfaceRef={surfaceRef} showMiniMap={showMiniMap} />
        }
        inspector={
          <div className="editor-sidebar">
            <div hidden={showSimulator}>
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
