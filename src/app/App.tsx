import { useRef } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { AppLayout } from '@/components/layout/AppLayout'
import { NodePalette } from '@/features/workflow/components/NodePalette'
import { PropertyInspector } from '@/features/workflow/components/PropertyInspector'
import { WorkflowCanvas } from '@/features/workflow/components/WorkflowCanvas'
import { WorkflowToolbar } from '@/features/workflow/components/WorkflowToolbar'

export function App() {
  const surfaceRef = useRef<HTMLDivElement>(null)

  return (
    <ReactFlowProvider>
      <AppLayout
        toolbar={<WorkflowToolbar />}
        palette={<NodePalette surfaceRef={surfaceRef} />}
        canvas={<WorkflowCanvas surfaceRef={surfaceRef} />}
        inspector={<PropertyInspector />}
      />
    </ReactFlowProvider>
  )
}
