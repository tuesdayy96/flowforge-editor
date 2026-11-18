import { useState } from 'react'
import { validateWorkflow, type ValidationResult } from '../domain/validation'
import { useWorkflowStore } from '../store/workflowStore'
import type { WorkflowPersistence } from '../services/workflowPersistence'
import { WorkflowFiles } from './WorkflowFiles'
import {
  WorkflowEditorActions,
  type MiniMapControls,
} from './WorkflowEditorActions'
import { WorkflowSaveStatus } from './WorkflowSaveStatus'
import { WorkflowValidation } from './WorkflowValidation'

export function WorkflowToolbar({
  persistence,
  showMiniMap,
  toggleMiniMap,
}: {
  persistence: WorkflowPersistence
} & MiniMapControls) {
  const [fileError, setFileError] = useState('')
  const [validation, setValidation] = useState<
    | {
        result: ValidationResult
        revision: number
      }
    | undefined
  >(() => {
    const { imported, nodes, edges, graphRevision } =
      useWorkflowStore.getState()
    if (imported)
      return { result: validateWorkflow(nodes, edges), revision: graphRevision }
  })
  const documentName = useWorkflowStore((state) => state.documentName)
  const canDeleteSelection = useWorkflowStore(
    ({ nodes, edges }) =>
      nodes.some((node) => node.selected && node.deletable !== false) ||
      edges.some((edge) => edge.selected),
  )
  const removeSelection = useWorkflowStore((state) => state.removeSelection)

  function validate() {
    const { nodes, edges, graphRevision } = useWorkflowStore.getState()
    setValidation({
      result: validateWorkflow(nodes, edges),
      revision: graphRevision,
    })
  }

  return (
    <div>
      <header className="toolbar flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="brand-mark" aria-hidden="true">
            ↳
          </span>
          FlowForge
        </div>
        <h1 className="workflow-title">
          {documentName.trim() || 'Untitled workflow'}
        </h1>
        <WorkflowSaveStatus persistence={persistence} />
        <div className="toolbar-actions">
          <WorkflowEditorActions
            showMiniMap={showMiniMap}
            toggleMiniMap={toggleMiniMap}
          />
          <WorkflowFiles onError={setFileError} />
          <button
            className="toolbar-validate"
            type="button"
            aria-expanded={Boolean(validation)}
            aria-controls={validation ? 'workflow-validation' : undefined}
            onClick={validate}
          >
            Validate
          </button>
          <button
            className="toolbar-delete"
            type="button"
            disabled={!canDeleteSelection}
            title="Delete selected nodes and links (Delete / Backspace)"
            onClick={removeSelection}
          >
            Delete selection
          </button>
        </div>
      </header>
      {fileError && (
        <p className="toolbar-file-error" role="alert">
          {fileError}
        </p>
      )}
      {validation && (
        <WorkflowValidation
          {...validation}
          onClose={() => setValidation(undefined)}
        />
      )}
    </div>
  )
}
