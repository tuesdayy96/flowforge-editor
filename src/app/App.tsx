import { useRef } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { NodePalette } from '@/features/workflow/components/NodePalette'
import { PropertyInspector } from '@/features/workflow/components/PropertyInspector'
import { WorkflowCanvas } from '@/features/workflow/components/WorkflowCanvas'
import { WorkflowToolbar } from '@/features/workflow/components/WorkflowToolbar'
import type { WorkflowPersistence } from '@/features/workflow/services/workflowPersistence'
import { useWorkflowStore } from '@/features/workflow/store/workflowStore'

export function App({ persistence }: { persistence: WorkflowPersistence }) {
  const generation = useWorkflowStore((state) => state.documentGeneration)
  return <Editor key={generation} persistence={persistence} />
}

function Editor({ persistence }: { persistence: WorkflowPersistence }) {
  const surfaceRef = useRef<HTMLDivElement>(null)

  return (
    <ReactFlowProvider>
      <AppLayout
        toolbar={<WorkflowToolbar persistence={persistence} />}
        palette={<NodePalette surfaceRef={surfaceRef} />}
        canvas={<WorkflowCanvas surfaceRef={surfaceRef} />}
        inspector={<PropertyInspector />}
      />
    </ReactFlowProvider>
  )
}
