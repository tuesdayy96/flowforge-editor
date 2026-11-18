import { EdgeChangeset, NodeChangeset } from '@xyflow/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { WorkflowEdge, WorkflowNode } from '../model/workflowNode'
import { projectDocument, validateDocument } from '../model/workflowDocument'
import {
  selectSelectedEdgeIds,
  selectSelectedNodeIds,
  useWorkflowStore,
} from './workflowStore'

const { getState, getInitialState, setState } = useWorkflowStore
const position = { x: 250, y: 145 }

function addLinkedAction() {
  getState().addNode('action', position)
  const [start, action] = getState().nodes
  getState().addEdge({
    source: start.id,
    sourceHandle: 'out',
    target: action.id,
    targetHandle: 'in',
  })
  return { start, action, edge: getState().edges[0] }
}

beforeEach(() => setState(getInitialState(), true))

describe('workflow store graph revision', () => {
  it('lets imported drafts repair the Start count while protecting the remaining Start', () => {
    const empty = { ...projectDocument(getState()), nodes: [] }
    getState().replaceDocument(validateDocument(empty), 'import')
    getState().addNode('start', position)
    getState().addNode('start', position)
    expect(getState().nodes).toHaveLength(1)

    const draft = projectDocument(getState())
    getState().replaceDocument(
      validateDocument({
        ...draft,
        nodes: [...draft.nodes, { ...draft.nodes[0], id: 'extra-start' }],
      }),
      'import',
    )
    getState().selectNode('extra-start')
    getState().removeSelection()
    expect(getState().nodes).toHaveLength(1)
    expect(getState().nodes[0].deletable).toBe(false)
  })

  it('keeps validation current through changes to layout, label and selection', () => {
    const { action, edge } = addLinkedAction()
    const revision = getState().graphRevision
    getState().applyEdgeChanges(
      new EdgeChangeset<WorkflowEdge>([
        { type: 'select', id: edge.id, selected: true },
      ]),
    )
    expect(selectSelectedEdgeIds(getState())).toEqual([edge.id])

    getState().selectNode(action.id)
    const moved = { x: 310, y: 225 }
    getState().applyNodeChanges(
      new NodeChangeset<WorkflowNode>([
        { type: 'position', id: action.id, position: moved },
      ]),
    )
    getState().updateNode(action.id, { label: 'Fetch' })

    const state = getState()
    expect(state.graphRevision).toBe(revision)
    expect(selectSelectedNodeIds(state)).toEqual([action.id])
    expect(selectSelectedEdgeIds(state)).toEqual([])
    expect(state.nodes[1]).toMatchObject({
      position: moved,
      data: { label: 'Fetch' },
    })
    expect(action.position).toEqual(position)
  })

  it('protects Start, preserves the input changeset and removes incident edges atomically', () => {
    const { start, action } = addLinkedAction()
    const revision = getState().graphRevision
    const changes = new NodeChangeset<WorkflowNode>([
      { type: 'remove', id: start.id },
      { type: 'remove', id: action.id },
    ])

    getState().applyNodeChanges(changes)

    expect(changes.toArray()).toHaveLength(2)
    expect(getState().nodes.map((node) => node.id)).toEqual([start.id])
    expect(getState().edges).toEqual([])
    expect(getState().graphRevision).toBe(revision + 1)
  })

  it('increments the revision for an edge deletion and preserves it when deletion is repeated', () => {
    const { edge } = addLinkedAction()
    const revision = getState().graphRevision
    const changes = new EdgeChangeset<WorkflowEdge>([
      { type: 'remove', id: edge.id },
    ])
    getState().applyEdgeChanges(changes)
    getState().applyEdgeChanges(changes)
    expect(getState().edges).toEqual([])
    expect(getState().graphRevision).toBe(revision + 1)
  })
})
