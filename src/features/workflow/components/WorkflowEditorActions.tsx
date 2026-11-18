import { useReactFlow } from '@xyflow/react'
import { fitViewOptions } from '../hooks/useEditorShortcuts'
import {
  selectCanRedo,
  selectCanUndo,
  useWorkflowStore,
} from '../store/workflowStore'

export interface MiniMapControls {
  showMiniMap: boolean
  toggleMiniMap: () => void
}

export function WorkflowEditorActions({
  showMiniMap,
  toggleMiniMap,
}: MiniMapControls) {
  const canUndo = useWorkflowStore(selectCanUndo)
  const canRedo = useWorkflowStore(selectCanRedo)
  const canCopy = useWorkflowStore(({ nodes }) =>
    nodes.some((node) => node.selected),
  )
  const canPaste = useWorkflowStore(({ clipboard }) =>
    Boolean(clipboard?.nodes.length),
  )
  const undo = useWorkflowStore((state) => state.undo)
  const redo = useWorkflowStore((state) => state.redo)
  const copySelection = useWorkflowStore((state) => state.copySelection)
  const paste = useWorkflowStore((state) => state.paste)
  const { fitView } = useReactFlow()

  return (
    <>
      <button
        type="button"
        className="toolbar-file"
        title="Undo (Ctrl / Cmd + Z)"
        disabled={!canUndo}
        onClick={undo}
      >
        Undo
      </button>
      <button
        type="button"
        className="toolbar-file"
        title="Redo (Ctrl / Cmd + Shift + Z, or Ctrl + Y)"
        disabled={!canRedo}
        onClick={redo}
      >
        Redo
      </button>
      <button
        type="button"
        className="toolbar-file"
        title="Copy selected nodes (Ctrl / Cmd + C)"
        disabled={!canCopy}
        onClick={copySelection}
      >
        Copy
      </button>
      <button
        type="button"
        className="toolbar-file"
        title="Paste nodes (Ctrl / Cmd + V)"
        disabled={!canPaste}
        onClick={paste}
      >
        Paste
      </button>
      <button
        type="button"
        className="toolbar-file"
        title="Fit view (Ctrl / Cmd + 0)"
        onClick={() => void fitView(fitViewOptions)}
      >
        Fit view
      </button>
      <button
        type="button"
        className="toolbar-file"
        title="Show or hide the canvas minimap"
        aria-pressed={showMiniMap}
        onClick={toggleMiniMap}
      >
        MiniMap
      </button>
    </>
  )
}
