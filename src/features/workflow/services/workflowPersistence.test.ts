import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deserializeDocument,
  projectDocument,
  serializeDocument,
} from '../model/workflowDocument'
import { useWorkflowStore } from '../store/workflowStore'
import {
  connectWorkflowPersistence,
  DRAFT_KEY,
  SAVE_DELAY,
  type WorkflowPersistence,
} from './workflowPersistence'
import { readWorkflowFile } from './workflowFiles'

const { getState, getInitialState, setState } = useWorkflowStore
let persistence: WorkflowPersistence | undefined

function storageWith(initial: string | null = null) {
  let value = initial
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => {
      value = next
    }),
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  setState(getInitialState(), true)
})
afterEach(() => {
  persistence?.disconnect()
  persistence = undefined
  vi.useRealTimers()
})

describe('workflow autosave', () => {
  it('stores a renamed draft without editing the graph or creating history', () => {
    const storage = storageWith()
    persistence = connectWorkflowPersistence(() => storage)
    const before = getState()

    before.renameDocument('  Order intake  ')
    vi.advanceTimersByTime(SAVE_DELAY)

    expect(deserializeDocument(storage.getItem()!).name).toBe('Order intake')
    expect(getState().nodes).toBe(before.nodes)
    expect(getState().history).toBe(before.history)
    expect(getState().graphRevision).toBe(before.graphRevision)
    before.renameDocument('Order intake')
    vi.runAllTimers()
    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })

  it('blocks writes after a storage read failure until replacement is confirmed', () => {
    const storage = storageWith('existing draft')
    storage.getItem.mockImplementationOnce(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError')
    })
    persistence = connectWorkflowPersistence(() => storage)
    getState().renameDocument('Current draft')
    vi.runAllTimers()
    persistence.flush()

    expect(persistence.status.getState()).toEqual({
      kind: 'restore-failed',
      detail: 'storageRead',
    })
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.getItem()).toBe('existing draft')

    persistence.replaceLocalDraft()
    expect(deserializeDocument(storage.getItem()!).name).toBe('Current draft')
  })

  it('restores multiple Starts and preserves their links into a Merge', () => {
    const storage = storageWith()
    persistence = connectWorkflowPersistence(() => storage)
    getState().addNode('start', { x: 50, y: 80 })
    getState().addNode('merge', { x: 200, y: 120 })
    const [first, second, merge] = getState().nodes
    for (const start of [first, second]) {
      getState().addEdge({
        source: start.id,
        sourceHandle: 'out',
        target: merge.id,
        targetHandle: 'in',
      })
    }
    const saved = projectDocument(getState())
    persistence.flush()
    persistence.disconnect()
    setState(getInitialState(), true)
    persistence = connectWorkflowPersistence(() => storage)
    expect(projectDocument(getState())).toEqual(saved)
    expect(getState().edges).toHaveLength(2)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })

  it('restores the validated draft before subscribing and does not write a default document', () => {
    const saved = {
      ...projectDocument(getState()),
      id: 'restored',
      name: 'Saved draft',
      viewport: { x: -45, y: 9, zoom: 1.2 },
    }
    const storage = storageWith(serializeDocument(saved))
    persistence = connectWorkflowPersistence(() => storage)
    vi.runAllTimers()
    expect(projectDocument(getState())).toEqual(saved)
    expect(persistence.status.getState()).toEqual({ kind: 'saved' })
    expect(storage.getItem).toHaveBeenCalledWith(DRAFT_KEY)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('debounces edits, writes the latest document and tracks successful writes', () => {
    const storage = storageWith()
    persistence = connectWorkflowPersistence(() => storage)
    vi.runAllTimers()
    expect(storage.setItem).not.toHaveBeenCalled()

    const id = getState().nodes[0].id
    getState().updateNode(id, { label: 'First' })
    vi.advanceTimersByTime(SAVE_DELAY - 1)
    getState().updateNode(id, { label: 'Last' })
    getState().updateViewport({ x: 20, y: -40, zoom: 0.75 })
    expect(persistence.status.getState()).toEqual({ kind: 'pending' })
    expect(storage.setItem).not.toHaveBeenCalled()
    vi.advanceTimersByTime(SAVE_DELAY)

    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(deserializeDocument(storage.getItem()!)).toEqual(
      projectDocument(getState()),
    )
    expect(persistence.status.getState()).toEqual({ kind: 'saved' })
    getState().selectNode(id)
    vi.runAllTimers()
    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })

  it('flushes the last pending edit without waiting and cancels the pending write', () => {
    const storage = storageWith()
    persistence = connectWorkflowPersistence(() => storage)
    getState().addNode('action', { x: 10, y: 20 })
    persistence.flush()
    vi.runAllTimers()
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(deserializeDocument(storage.getItem()!).nodes).toHaveLength(2)
  })

  it('preserves damaged local data through edits and import until explicitly replaced', () => {
    const storage = storageWith('invalid-json')
    persistence = connectWorkflowPersistence(() => storage)
    getState().addNode('action', { x: 10, y: 20 })
    const imported = deserializeDocument(
      serializeDocument({ ...projectDocument(getState()), id: 'imported' }),
    )
    getState().replaceDocument(imported, 'import')
    persistence.flush()
    vi.runAllTimers()
    expect(storage.getItem()).toBe('invalid-json')
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(persistence.status.getState()).toMatchObject({
      kind: 'restore-failed',
    })

    persistence.replaceLocalDraft()
    expect(deserializeDocument(storage.getItem()!).id).toBe('imported')
    expect(persistence.status.getState()).toEqual({ kind: 'saved' })
  })

  it.each([
    new Error('blocked'),
    new DOMException('full', 'QuotaExceededError'),
  ])(
    'retains pending work when a write fails and allows retry (%s)',
    (error) => {
      const storage = storageWith()
      storage.setItem.mockImplementationOnce(() => {
        throw error
      })
      persistence = connectWorkflowPersistence(() => storage)
      getState().addNode('end', { x: 10, y: 20 })
      persistence.flush()
      expect(persistence.status.getState()).toMatchObject({
        kind: 'save-failed',
      })
      expect(storage.getItem()).toBeNull()
      expect(getState().nodes).toHaveLength(2)
      persistence.flush()
      expect(persistence.status.getState()).toEqual({ kind: 'saved' })
      expect(deserializeDocument(storage.getItem()!).nodes).toHaveLength(2)
    },
  )

  it('leaves both editor and local storage untouched when a candidate import fails', async () => {
    const original = serializeDocument(projectDocument(getState()))
    const storage = storageWith(original)
    persistence = connectWorkflowPersistence(() => storage)
    const before = getState()
    await expect(
      readWorkflowFile(new File(['{'], 'bad.json')).then((document) => {
        getState().replaceDocument(document, 'import')
      }),
    ).rejects.toMatchObject({ code: 'json-syntax' })
    vi.runAllTimers()
    expect(getState()).toBe(before)
    expect(storage.getItem()).toBe(original)
    expect(storage.setItem).not.toHaveBeenCalled()
  })
})
