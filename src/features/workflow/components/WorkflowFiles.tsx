import { useTranslation } from '@/shared/i18n'
import { useRef, useState, type ChangeEvent } from 'react'
import { WorkflowDocumentError } from '../model/workflowDocument'
import { downloadWorkflow, readWorkflowFile } from '../services/workflowFiles'
import { useWorkflowStore } from '../store/workflowStore'

export type WorkflowFileError =
  WorkflowDocumentError | 'readFailed' | 'downloadFailed'

export function WorkflowFiles({
  onError,
}: {
  onError: (error?: WorkflowFileError) => void
}) {
  const t = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    onError()
    setReading(true)
    try {
      const document = await readWorkflowFile(file)
      if (window.confirm(t('confirmImport'))) {
        useWorkflowStore.getState().replaceDocument(document, 'import')
      }
    } catch (error) {
      onError(error instanceof WorkflowDocumentError ? error : 'readFailed')
    } finally {
      setReading(false)
    }
  }

  function exportFile() {
    onError()
    try {
      downloadWorkflow(useWorkflowStore.getState())
    } catch (error) {
      onError(error instanceof WorkflowDocumentError ? error : 'downloadFailed')
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => void importFile(event)}
      />
      <button
        type="button"
        className="toolbar-file"
        disabled={reading}
        onClick={() => input.current?.click()}
      >
        {t(reading ? 'reading' : 'importJson')}
      </button>
      <button type="button" className="toolbar-file" onClick={exportFile}>
        {t('exportJson')}
      </button>
    </>
  )
}
