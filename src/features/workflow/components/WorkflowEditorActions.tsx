import { useTranslation } from '@/shared/i18n'
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
  const t = useTranslation()
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
        title={t('undoTip')}
        disabled={!canUndo}
        onClick={undo}
      >
        {t('undo')}
      </button>
      <button
        type="button"
        className="toolbar-file"
        title={t('redoTip')}
        disabled={!canRedo}
        onClick={redo}
      >
        {t('redo')}
      </button>
      <button
        type="button"
        className="toolbar-file"
        title={t('copyTip')}
        disabled={!canCopy}
        onClick={copySelection}
      >
        {t('copy')}
      </button>
      <button
        type="button"
        className="toolbar-file"
        title={t('pasteTip')}
        disabled={!canPaste}
        onClick={paste}
      >
        {t('paste')}
      </button>
      <button
        type="button"
        className="toolbar-file"
        title={t('fitTip')}
        onClick={() => void fitView(fitViewOptions)}
      >
        {t('fit')}
      </button>
      <button
        type="button"
        className="toolbar-file"
        title={t('minimapTip')}
        aria-pressed={showMiniMap}
        onClick={toggleMiniMap}
      >
        {t('minimap')}
      </button>
    </>
  )
}
