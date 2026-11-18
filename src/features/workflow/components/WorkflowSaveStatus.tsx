import { useTranslation } from '@/shared/i18n'
import { useStore } from 'zustand'
import type { WorkflowPersistence } from '../services/workflowPersistence'

import { documentErrorMessage } from './workflowMessages'

export function WorkflowSaveStatus({
  persistence,
}: {
  persistence: WorkflowPersistence
}) {
  const t = useTranslation()
  const status = useStore(persistence.status)

  function replaceDraft() {
    if (window.confirm(t('confirmReplace'))) {
      persistence.replaceLocalDraft()
    }
  }

  return (
    <div className="workflow-save-status">
      <p role="status">
        <span>{t(status.kind)}</span>
        {'detail' in status && (
          <span className="workflow-save-detail">
            {' '}
            ·{' '}
            {typeof status.detail === 'string' ? (
              t(status.detail)
            ) : (
              <>
                {status.kind === 'restore-failed' && (
                  <>{t('restoreProtected')} </>
                )}
                {documentErrorMessage(t, status.detail)}
              </>
            )}
          </span>
        )}
      </p>
      {status.kind === 'restore-failed' && (
        <button type="button" onClick={replaceDraft}>
          {t('replaceDraft')}
        </button>
      )}
      {status.kind === 'save-failed' && (
        <button type="button" onClick={persistence.flush}>
          {t('retrySave')}
        </button>
      )}
    </div>
  )
}
