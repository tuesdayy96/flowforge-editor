import { useRef, useState, type ChangeEvent } from 'react'
import { WorkflowDocumentError } from '../model/workflowDocument'
import { downloadWorkflow, readWorkflowFile } from '../services/workflowFiles'
import { useWorkflowStore } from '../store/workflowStore'

export function WorkflowFiles({
  onError,
}: {
  onError: (message: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    onError('')
    setReading(true)
    try {
      const document = await readWorkflowFile(file)
      if (
        window.confirm(
          'Replace the current workflow with this JSON document? Export the current workflow first if you want to keep a copy.',
        )
      ) {
        useWorkflowStore.getState().replaceDocument(document, 'import')
      }
    } catch (error) {
      onError(
        error instanceof WorkflowDocumentError
          ? error.message
          : 'The JSON file could not be read.',
      )
    } finally {
      setReading(false)
    }
  }

  function exportFile() {
    onError('')
    try {
      downloadWorkflow(useWorkflowStore.getState())
    } catch (error) {
      onError(
        error instanceof WorkflowDocumentError
          ? error.message
          : 'The workflow could not be downloaded.',
      )
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
        {reading ? 'Reading JSON…' : 'Import JSON'}
      </button>
      <button type="button" className="toolbar-file" onClick={exportFile}>
        Export JSON
      </button>
    </>
  )
}
