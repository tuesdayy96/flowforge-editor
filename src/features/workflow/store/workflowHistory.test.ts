import { NodeChangeset, EdgeChangeset } from '@xyflow/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { projectDocument, validateDocument } from '../model/workflowDocument'
import type { WorkflowEdge, WorkflowNode } from '../model/workflowNode'
import { useWorkflowStore } from './workflowStore'

const { getState, getInitialState, setState } = useWorkflowStore
const position = { x: 300, y: 180 }

function connect(source: string, target: string, sourceHandle = 'out') {
  getState().addEdge({ source, target, sourceHandle, targetHandle: 'in' })
}

beforeEach(() => setState(getInitialState(), true))

describe('editor history', () => {
  it('undoes and redoes additions and invalidates redo after a new edit', () => {
    const { addNode, undo, redo, canUndo, canRedo } = getState()
    expect(canUndo()).toBe(false)
    addNode('merge', position)
    const original = getState().nodes[1].id
    undo()
    expect(getState().nodes).toHaveLength(1)
    expect(canRedo()).toBe(true)
    redo()
    expect(getState().nodes[1].id).toBe(original)
    undo()
    addNode('action', position)
    expect(canRedo()).toBe(false)
  })

  it('restores a deleted node and its links in one undo and updates validation revision', () => {
    getState().addNode('action', position)
    const [start, action] = getState().nodes
    connect(start.id, action.id)
    const revision = getState().graphRevision
    const saved = getState().edges[0]
    getState().selectAll()
    getState().removeSelection()
    expect(getState().nodes).toHaveLength(0)
    expect(getState().edges).toHaveLength(0)
    getState().undo()
    expect(getState().nodes.map(({ id }) => id)).toEqual([start.id, action.id])
    expect(getState().edges[0]).toEqual(saved)
    expect(getState().nodes.some((node) => node.selected)).toBe(false)
    expect(getState().graphRevision).toBe(revision + 2)
    getState().redo()
    expect(getState().nodes).toHaveLength(0)
  })

  it('undoes connecting and deleting a Condition branch independently', () => {
    const { addNode, undo, redo, applyEdgeChanges } = getState()
    addNode('condition', position)
    addNode('end', position)
    const [, condition, end] = getState().nodes
    connect(condition.id, end.id, 'false')
    const edge = getState().edges[0]
    undo()
    expect(getState().edges).toEqual([])
    redo()
    applyEdgeChanges(
      new EdgeChangeset<WorkflowEdge>([{ type: 'remove', id: edge.id }]),
    )
    expect(getState().edges).toEqual([])
    undo()
    expect(getState().edges).toEqual([edge])
  })

  it.each([1, 2])('batches repeated drag updates for %d nodes', (count) => {
    getState().addNode('action', position)
    const { nodes, applyNodeChanges, beginEdit, finishEdit, undo } = getState()
    const original = nodes.map((node) => node.position)
    const revision = getState().graphRevision
    getState().clearHistory()
    beginEdit('drag')
    for (let step = 1; step <= 3; step++) {
      applyNodeChanges(
        new NodeChangeset<WorkflowNode>(
          nodes.slice(0, count).map((node) => ({
            type: 'position',
            id: node.id,
            position: { x: node.position.x + step, y: node.position.y },
          })),
        ),
      )
    }
    finishEdit('drag')
    expect(getState().history.past).toHaveLength(1)
    undo()
    expect(getState().nodes.map((node) => node.position)).toEqual(original)
    expect(getState().graphRevision).toBe(revision)
  })

  it('groups property changes and skips no-op and reverted items', () => {
    const {
      nodes: [start],
      beginEdit,
      finishEdit,
      updateNode,
      undo,
      canUndo,
      canRedo,
    } = getState()
    beginEdit('property')
    updateNode(start.id, { label: 'Almost' })
    updateNode(start.id, { label: start.data.label })
    finishEdit('property')
    expect(canUndo()).toBe(false)
    beginEdit('property')
    updateNode(start.id, { label: 'A' })
    updateNode(start.id, { label: 'Arrival' })
    finishEdit('property')
    expect(getState().history.past).toHaveLength(1)
    undo()
    expect(getState().nodes[0].data.label).toBe(start.data.label)
    expect(canRedo()).toBe(true)
    getState().selectAll()
    getState().updateViewport({ x: 10, y: 20, zoom: 1.2 })
    expect(canRedo()).toBe(true)
  })

  it('limits history to 100 items and resets it when importing or restoring', () => {
    const {
      nodes: [start],
      updateNode,
      replaceDocument,
    } = getState()
    for (let index = 0; index < 105; index++)
      updateNode(start.id, { label: String(index) })
    expect(getState().history.past).toHaveLength(100)
    const draft = validateDocument(projectDocument(getState()))
    for (const source of ['import', 'restore'] as const) {
      getState().undo()
      replaceDocument(draft, source)
      expect(getState().history).toEqual({ past: [], future: [] })
    }
  })
})

describe('contextual editing commands', () => {
  it('duplicates selected nodes and internal links in one undo without replacing the clipboard', () => {
    const state = getState()
    state.addNode('action', position)
    state.addNode('end', { x: 500, y: 200 })
    const [start, action, end] = getState().nodes
    connect(start.id, action.id)
    connect(action.id, end.id)
    state.selectNode(end.id)
    state.copySelection()
    const clipboard = getState().clipboard
    state.applyNodeChanges(
      new NodeChangeset<WorkflowNode>([
        { type: 'select', id: end.id, selected: false },
        { type: 'select', id: start.id, selected: true },
        { type: 'select', id: action.id, selected: true },
      ]),
    )
    state.clearHistory()
    state.duplicateSelection()
    const { nodes, edges, history } = getState()
    expect(new Set(nodes.map(({ id }) => id)).size).toBe(5)
    expect(new Set(edges.map(({ id }) => id)).size).toBe(3)
    expect(edges[2]).toMatchObject({ source: nodes[3].id, target: nodes[4].id })
    expect(getState().clipboard).toBe(clipboard)
    expect(history.past).toHaveLength(1)
    state.undo()
    expect(getState().nodes).toHaveLength(3)
    expect(getState().edges).toHaveLength(2)
  })

  it('pastes at a supplied flow position and retains incremental keyboard paste', () => {
    const state = getState()
    const [start] = state.nodes
    state.selectNode(start.id)
    state.copySelection()
    state.clearHistory()
    state.paste(position)
    expect(getState().nodes[1].position).toEqual(position)
    expect(getState().history.past).toHaveLength(1)
    state.undo()
    state.paste()
    expect(getState().nodes[1].position).toEqual({
      x: start.position.x + 32,
      y: start.position.y + 32,
    })
  })

  it('deletes only the targeted edge and preserves validation revision and undo semantics', () => {
    const state = getState()
    state.addNode('action', position)
    state.addNode('end', position)
    const [start, action, end] = getState().nodes
    connect(start.id, action.id)
    connect(action.id, end.id)
    const [first, second] = getState().edges
    state.selectAll()
    state.clearHistory()
    const revision = getState().graphRevision
    state.removeEdge(second.id)
    expect(getState().edges.map(({ id }) => id)).toEqual([first.id])
    expect(getState().graphRevision).toBe(revision + 1)
    expect(getState().history.past).toHaveLength(1)
    state.undo()
    expect(getState().edges.map(({ id }) => id)).toEqual([first.id, second.id])
  })
})

describe('editor clipboard', () => {
  it('copies a single node and creates a new selected node with an offset', () => {
    const [start] = getState().nodes
    getState().selectNode(start.id)
    getState().copySelection()
    getState().paste()
    const pasted = getState().nodes[1]
    expect(pasted.id).not.toBe(start.id)
    expect(pasted.type).toBe('start')
    expect(pasted.selected).toBe(true)
    expect(pasted.position.x).toBeGreaterThan(start.position.x)
  })

  it('copies two Starts and a Merge with internal edges, remaps IDs and undoes one paste', () => {
    const { addNode, applyNodeChanges, copySelection, paste, undo } = getState()
    addNode('start', position)
    addNode('merge', { x: 400, y: 250 })
    addNode('end', { x: 650, y: 250 })
    const [start, second, merge, end] = getState().nodes
    connect(start.id, merge.id)
    connect(second.id, merge.id)
    connect(merge.id, end.id)
    const originals = getState().edges
    applyNodeChanges(
      new NodeChangeset<WorkflowNode>(
        [start, second, merge].map(({ id }) => ({
          type: 'select',
          id,
          selected: true,
        })),
      ),
    )
    copySelection()
    expect(getState().clipboard?.edges).toHaveLength(2)
    const revision = getState().graphRevision
    paste()
    const [one, two, junction] = getState().nodes.slice(4)
    expect([one.type, two.type, junction.type]).toEqual([
      'start',
      'start',
      'merge',
    ])
    expect(getState().edges.slice(3)).toEqual([
      expect.objectContaining({
        source: one.id,
        target: junction.id,
        sourceHandle: 'out',
        targetHandle: 'in',
      }),
      expect.objectContaining({ source: two.id, target: junction.id }),
    ])
    expect(new Set(getState().edges.map(({ id }) => id)).size).toBe(5)
    expect(two.position.x - one.position.x).toBe(
      second.position.x - start.position.x,
    )
    paste()
    expect(getState().nodes[7].position.x - one.position.x).toBe(
      one.position.x - start.position.x,
    )
    undo()
    expect(getState().nodes).toHaveLength(7)
    expect(getState().edges.slice(0, 3)).toEqual(originals)
    expect(getState().graphRevision).toBe(revision + 3)
  })
})
