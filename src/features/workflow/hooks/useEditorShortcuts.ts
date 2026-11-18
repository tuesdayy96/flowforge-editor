import { useEffect, type RefObject } from 'react'
import { useReactFlow } from '@xyflow/react'
import { bindEditorShortcuts } from '../services/editorShortcuts'
import { useWorkflowStore } from '../store/workflowStore'

export const fitViewOptions = { padding: 48, maxZoom: 1 }

export function useEditorShortcuts(
  surfaceRef: RefObject<HTMLDivElement | null>,
) {
  const { fitView } = useReactFlow()

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return
    function retainCanvasFocus(action: 'undo' | 'redo' | 'removeSelection') {
      return () => {
        surface?.focus({ preventScroll: true })
        useWorkflowStore.getState()[action]()
      }
    }
    return bindEditorShortcuts(surface, {
      undo: retainCanvasFocus('undo'),
      redo: retainCanvasFocus('redo'),
      copy: () => useWorkflowStore.getState().copySelection(),
      paste: () => useWorkflowStore.getState().paste(),
      selectAll: () => useWorkflowStore.getState().selectAll(),
      remove: retainCanvasFocus('removeSelection'),
      fit: () => void fitView(fitViewOptions),
    })
  }, [fitView, surfaceRef])
}
