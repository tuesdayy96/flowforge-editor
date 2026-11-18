import { useState } from 'react'
import { validateWorkflow, type ValidationResult } from '../domain/validation'
import { useWorkflowStore } from '../store/workflowStore'
import { WorkflowValidation } from './WorkflowValidation'

export function WorkflowToolbar() {
  const [validation, setValidation] = useState<{
    result: ValidationResult
    revision: number
  }>()
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
        <h1 className="workflow-title">Untitled workflow</h1>
        <div className="toolbar-actions">
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
            onClick={removeSelection}
          >
            Delete selection
          </button>
        </div>
      </header>
      {validation && (
        <WorkflowValidation
          {...validation}
          onClose={() => setValidation(undefined)}
        />
      )}
    </div>
  )
}
