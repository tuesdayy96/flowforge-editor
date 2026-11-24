import {
  selectSimulationLocked,
  useSimulationStore,
} from '../store/simulationStore'
import { useTranslation } from '@/shared/i18n'
import { useState } from 'react'
import { validateWorkflow, type ValidationResult } from '../domain/validation'
import {
  DEFAULT_WORKFLOW_NAME,
  DOCUMENT_LIMITS,
} from '../model/workflowDocument'
import { useWorkflowStore } from '../store/workflowStore'
import type { WorkflowPersistence } from '../services/workflowPersistence'
import { WorkflowFiles, type WorkflowFileError } from './WorkflowFiles'
import { documentErrorMessage } from './workflowMessages'
import { LanguageSelect } from '@/shared/i18n/LanguageSelect'
import { GuideControls } from '@/features/guide/GuideControls'
import { WorkflowSaveStatus } from './WorkflowSaveStatus'
import { WorkflowValidation } from './WorkflowValidation'

export interface MiniMapControls {
  showMiniMap: boolean
  toggleMiniMap: () => void
}

export function WorkflowToolbar({
  persistence,
  showMiniMap,
  toggleMiniMap,
  showSimulator,
  toggleSimulator,
}: {
  persistence: WorkflowPersistence
} & MiniMapControls & { showSimulator: boolean; toggleSimulator: () => void }) {
  const t = useTranslation()
  const locked = useSimulationStore(selectSimulationLocked)
  const [fileError, setFileError] = useState<WorkflowFileError>()
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
  const renameDocument = useWorkflowStore((state) => state.renameDocument)
  const [draftName, setDraftName] = useState<string>()
  const displayedName =
    !documentName.trim() || documentName === DEFAULT_WORKFLOW_NAME
      ? t('untitled')
      : documentName.trim()
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
        <h1 className="sr-only">{displayedName}</h1>
        <input
          className="workflow-title"
          disabled={locked}
          aria-label={t('workflowName')}
          title={t('editName')}
          maxLength={DOCUMENT_LIMITS.name}
          value={draftName ?? displayedName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={() => {
            if (draftName !== undefined) renameDocument(draftName)
            setDraftName(undefined)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setDraftName(undefined)
            }
          }}
        />
        <WorkflowSaveStatus persistence={persistence} />
        <div className="toolbar-actions">
          <button
            className="toolbar-file"
            type="button"
            aria-pressed={showMiniMap}
            title={t('minimapTip')}
            onClick={toggleMiniMap}
          >
            {t('minimap')}
          </button>
          <WorkflowFiles onError={setFileError} />
          <button
            className="toolbar-validate"
            type="button"
            aria-expanded={Boolean(validation)}
            aria-controls={validation ? 'workflow-validation' : undefined}
            onClick={validate}
          >
            {t('validate')}
          </button>
          <button
            className="toolbar-file"
            type="button"
            aria-expanded={showSimulator}
            aria-controls="workflow-simulator"
            onClick={toggleSimulator}
          >
            {t('simulation')}
          </button>
          <GuideControls />
          <LanguageSelect />
        </div>
      </header>
      {fileError && (
        <p className="toolbar-file-error" role="alert">
          {typeof fileError === 'string'
            ? t(fileError)
            : documentErrorMessage(t, fileError)}
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
