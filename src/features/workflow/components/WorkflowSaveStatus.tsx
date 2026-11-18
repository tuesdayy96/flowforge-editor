import { useStore } from 'zustand'
import type { WorkflowPersistence } from '../services/workflowPersistence'

const labels = {
  unsaved: 'Not saved locally',
  pending: 'Unsaved changes',
  saving: 'Saving locally…',
  saved: 'Saved locally',
  'save-failed': 'Local save failed',
  'restore-failed': 'Local restore failed',
}

export function WorkflowSaveStatus({
  persistence,
}: {
  persistence: WorkflowPersistence
}) {
  const status = useStore(persistence.status)

  function replaceDraft() {
    if (
      window.confirm(
        'Replace the existing local draft with the current workflow? This will overwrite the stored data.',
      )
    ) {
      persistence.replaceLocalDraft()
    }
  }

  return (
    <div className="workflow-save-status">
      <p role="status">
        <span>{labels[status.kind]}</span>
        {'message' in status && (
          <span className="workflow-save-detail"> · {status.message}</span>
        )}
      </p>
      {status.kind === 'restore-failed' && (
        <button type="button" onClick={replaceDraft}>
          Replace local draft
        </button>
      )}
      {status.kind === 'save-failed' && (
        <button type="button" onClick={persistence.flush}>
          Retry local save
        </button>
      )}
    </div>
  )
}
