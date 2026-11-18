import {
  deserializeDocument,
  DOCUMENT_LIMITS,
  projectDocument,
  serializeDocument,
  WorkflowDocumentError,
  type DocumentState,
} from '../model/workflowDocument'

export async function readWorkflowFile(file: File) {
  if (file.size > DOCUMENT_LIMITS.bytes) {
    throw new WorkflowDocumentError(
      'too-large',
      'The workflow JSON exceeds 1 MiB.',
    )
  }
  const bytes = await file.arrayBuffer()
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new WorkflowDocumentError(
      'json-syntax',
      'The file must contain UTF-8 JSON.',
    )
  }
  return deserializeDocument(text)
}

export function workflowFileName(name: string) {
  const clean = Array.from(
    name
      .replace(/[^\p{L}\p{N}._ -]/gu, '-')
      .trim()
      .replace(/\s+/g, '-'),
  )
    .slice(0, 80)
    .join('')
    .replace(/^[. -]+|[. -]+$/g, '')
  if (!clean || /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(clean))
    return 'workflow.json'
  return `${clean}.json`
}

export function downloadWorkflow(document: DocumentState) {
  const text = serializeDocument(projectDocument(document))
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json;charset=utf-8' }),
  )
  const link = window.document.createElement('a')
  link.href = url
  link.download = workflowFileName(document.documentName)
  try {
    window.document.body.append(link)
    link.click()
  } finally {
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
