import { createStore } from 'zustand/vanilla'
import {
  deserializeDocument,
  projectDocument,
  serializeDocument,
  WorkflowDocumentError,
  type DocumentState,
} from '../model/workflowDocument'
import { useWorkflowStore } from '../store/workflowStore'

export const DRAFT_KEY = 'flowforge:workflow:current'
export const SAVE_DELAY = 350

type DraftStorage = Pick<Storage, 'getItem' | 'setItem'>
type SaveStatus =
  | { kind: 'unsaved' | 'pending' | 'saving' | 'saved' }
  | { kind: 'save-failed' | 'restore-failed'; message: string }

function documentChanged(next: DocumentState, previous: DocumentState) {
  if (
    next.documentId !== previous.documentId ||
    next.documentName !== previous.documentName ||
    next.viewport !== previous.viewport ||
    next.nodes.length !== previous.nodes.length ||
    next.edges.length !== previous.edges.length
  )
    return true

  return (
    (next.nodes !== previous.nodes &&
      next.nodes.some((node, index) => {
        const before = previous.nodes[index]
        return (
          node !== before &&
          (node.id !== before.id ||
            node.type !== before.type ||
            node.data !== before.data ||
            node.position.x !== before.position.x ||
            node.position.y !== before.position.y)
        )
      })) ||
    (next.edges !== previous.edges &&
      next.edges.some((edge, index) => {
        const before = previous.edges[index]
        return (
          edge !== before &&
          (edge.id !== before.id ||
            edge.source !== before.source ||
            edge.target !== before.target ||
            edge.sourceHandle !== before.sourceHandle ||
            edge.targetHandle !== before.targetHandle)
        )
      }))
  )
}

function saveErrorMessage(error: unknown) {
  if (error instanceof WorkflowDocumentError) return error.message
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return 'Browser storage is full. Export your work or free up storage and retry.'
  }
  return 'Browser storage could not be written. Export your work or retry.'
}

export function connectWorkflowPersistence(storage: () => DraftStorage) {
  const status = createStore<SaveStatus>(() => ({ kind: 'unsaved' }))
  let blocked = false
  let dirty = false
  let timer: ReturnType<typeof setTimeout> | undefined

  // Restore before subscribing so the initial document cannot overwrite stored data.
  try {
    const saved = storage().getItem(DRAFT_KEY)
    if (saved !== null) {
      useWorkflowStore
        .getState()
        .replaceDocument(deserializeDocument(saved), 'restore')
      status.setState({ kind: 'saved' }, true)
    }
  } catch (error) {
    blocked = true
    status.setState(
      {
        kind: 'restore-failed',
        message:
          error instanceof WorkflowDocumentError
            ? `Could not restore the local draft. ${error.message} The original data is protected.`
            : 'Could not read browser storage. Automatic writes are paused.',
      },
      true,
    )
  }

  function flush() {
    clearTimeout(timer)
    timer = undefined
    if (blocked || !dirty) return

    status.setState({ kind: 'saving' }, true)
    try {
      const text = serializeDocument(
        projectDocument(useWorkflowStore.getState()),
      )
      storage().setItem(DRAFT_KEY, text)
      dirty = false
      status.setState({ kind: 'saved' }, true)
    } catch (error) {
      status.setState(
        { kind: 'save-failed', message: saveErrorMessage(error) },
        true,
      )
    }
  }

  const unsubscribe = useWorkflowStore.subscribe((next, previous) => {
    if (
      next.documentGeneration === previous.documentGeneration &&
      !documentChanged(next, previous)
    )
      return
    dirty = true
    if (blocked) return
    if (status.getState().kind !== 'pending')
      status.setState({ kind: 'pending' }, true)
    clearTimeout(timer)
    timer = setTimeout(flush, SAVE_DELAY)
  })

  return {
    status,
    flush,
    replaceLocalDraft: () => {
      if (!blocked) return
      blocked = false
      dirty = true
      flush()
    },
    disconnect: () => {
      clearTimeout(timer)
      unsubscribe()
    },
  }
}

export type WorkflowPersistence = ReturnType<typeof connectWorkflowPersistence>
