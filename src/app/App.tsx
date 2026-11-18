import { AppLayout } from '@/components/layout/AppLayout'
import { NodePalette } from '@/features/workflow/components/NodePalette'
import { PropertyInspector } from '@/features/workflow/components/PropertyInspector'
import { WorkflowCanvas } from '@/features/workflow/components/WorkflowCanvas'
import { WorkflowToolbar } from '@/features/workflow/components/WorkflowToolbar'

export function App() {
  return (
    <AppLayout
      toolbar={<WorkflowToolbar />}
      palette={<NodePalette />}
      canvas={<WorkflowCanvas />}
      inspector={<PropertyInspector />}
    />
  )
}
