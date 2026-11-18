import type { translator } from '@/shared/i18n'
import type { ValidationIssue } from '../domain/validation'
import {
  DOCUMENT_LIMITS,
  type WorkflowDocumentError,
} from '../model/workflowDocument'

type Translate = ReturnType<typeof translator>

export function validationMessage(t: Translate, issue: ValidationIssue) {
  const key =
    issue.code === 'missing-output'
      ? issue.nodeType === 'condition'
        ? 'missingCondition'
        : issue.nodeType === 'merge'
          ? 'missingMerge'
          : issue.code
      : issue.code
  return t(key, { output: issue.output })
}

export function documentErrorMessage(
  t: Translate,
  error: WorkflowDocumentError,
) {
  if (error.code === 'too-large') {
    if (error.params.field === 'nodes')
      return t('tooManyNodes', { limit: DOCUMENT_LIMITS.nodes })
    if (error.params.field === 'edges')
      return t('tooManyEdges', { limit: DOCUMENT_LIMITS.edges })
  }
  if (error.code === 'json-syntax' && error.params.encoding)
    return t('invalid-encoding')
  if (error.code === 'invalid-field' && error.params.edge)
    return t('invalidHandle', error.params)
  return t(error.code, error.params)
}
