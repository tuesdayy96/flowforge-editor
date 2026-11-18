import { EdgeChangeset, NodeChangeset, type XYPosition } from '@xyflow/react'
import { create } from 'zustand'
import {
  canConnect,
  type WorkflowConnection,
  type WorkflowNodeType,
} from '../domain/connection'
import {
  DEFAULT_VIEWPORT,
  DEFAULT_WORKFLOW_NAME,
  DOCUMENT_LIMITS,
  type WorkflowDocument,
} from '../model/workflowDocument'
import { copyGraph, duplicateGraph } from '../model/workflowClipboard'
import {
  createWorkflowNode,
  projectGraph,
  type GraphSnapshot,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeData,
} from '../model/workflowNode'

const HISTORY_LIMIT = 100
type EditKind = 'drag' | 'property'
type GraphPatch = Partial<
  Pick<WorkflowState, 'nodes' | 'edges' | 'graphRevision'>
>
interface History {
  past: GraphSnapshot[]
  future: GraphSnapshot[]
}
interface EditTransaction {
  kind: EditKind
  before: GraphSnapshot
  changed: boolean
}

interface WorkflowState {
  documentId: string
  documentName: string
  renameDocument: (name: string) => void
  viewport: WorkflowDocument['viewport']
  documentGeneration: number
  imported: boolean
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  graphRevision: number
  history: History
  transaction?: EditTransaction
  clipboard?: GraphSnapshot
  pasteCount: number
  beginEdit: (kind: EditKind) => void
  finishEdit: (kind: EditKind) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
  copySelection: () => void
  paste: () => void
  selectAll: () => void
  replaceDocument: (
    document: WorkflowDocument,
    source: 'restore' | 'import',
  ) => void
  updateViewport: (viewport: WorkflowDocument['viewport']) => void
  addNode: (type: WorkflowNodeType, position: XYPosition) => void
  updateNode: (id: string, changes: Partial<WorkflowNodeData>) => void
  addEdge: (connection: WorkflowConnection) => void
  removeSelection: () => void
  selectNode: (id: string) => void
  applyNodeChanges: (changes: NodeChangeset<WorkflowNode>) => void
  applyEdgeChanges: (changes: EdgeChangeset<WorkflowEdge>) => void
}

export const selectCanUndo = ({ history, transaction }: WorkflowState) =>
  history.past.length > 0 || Boolean(transaction?.changed)
export const selectCanRedo = ({ history, transaction }: WorkflowState) =>
  history.future.length > 0 && !transaction?.changed

function pushHistory(history: History, before: GraphSnapshot): History {
  return {
    past: [...history.past.slice(1 - HISTORY_LIMIT), before],
    future: [],
  }
}

function finishTransaction(state: WorkflowState): History {
  const { transaction, history } = state
  if (!transaction?.changed) return history
  return JSON.stringify(projectGraph(state)) ===
    JSON.stringify(transaction.before)
    ? history
    : pushHistory(history, transaction.before)
}

function recordGraphEdit(
  state: WorkflowState,
  patch: GraphPatch,
  kind?: EditKind,
) {
  const { transaction } = state
  if (transaction && transaction.kind === kind) {
    return {
      ...patch,
      transaction: transaction.changed
        ? transaction
        : { ...transaction, changed: true },
    }
  }
  return {
    ...patch,
    history: pushHistory(finishTransaction(state), projectGraph(state)),
    transaction: undefined,
  }
}

function restoreGraph(
  state: WorkflowState,
  snapshot: GraphSnapshot,
  history: History,
) {
  const topologyChanged =
    state.nodes.length !== snapshot.nodes.length ||
    state.edges.length !== snapshot.edges.length ||
    state.nodes.some(
      (node, i) =>
        node.id !== snapshot.nodes[i].id ||
        node.type !== snapshot.nodes[i].type,
    ) ||
    state.edges.some((edge, i) => {
      const previous = snapshot.edges[i]
      return (
        edge.id !== previous.id ||
        edge.source !== previous.source ||
        edge.target !== previous.target ||
        edge.sourceHandle !== previous.sourceHandle ||
        edge.targetHandle !== previous.targetHandle
      )
    })
  return {
    ...projectGraph(snapshot),
    history,
    transaction: undefined,
    graphRevision: state.graphRevision + Number(topologyChanged),
  }
}

export const selectSelectedNodeIds = ({ nodes }: WorkflowState) =>
  nodes.filter((node) => node.selected).map((node) => node.id)

export const selectSelectedEdgeIds = ({ edges }: WorkflowState) =>
  edges.filter((edge) => edge.selected).map((edge) => edge.id)

function removeIncidentEdges(
  edges: WorkflowEdge[],
  removedNodeIds: Set<string>,
) {
  if (!removedNodeIds.size) return edges
  return edges.filter(
    (edge) =>
      !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target),
  )
}

export const useWorkflowStore = create<WorkflowState>()((set, get) => ({
  documentId: crypto.randomUUID(),
  documentName: DEFAULT_WORKFLOW_NAME,
  renameDocument: (name) =>
    set((state) => {
      const documentName = name.trim() || DEFAULT_WORKFLOW_NAME
      return documentName === state.documentName ||
        documentName.length > DOCUMENT_LIMITS.name
        ? state
        : { documentName }
    }),
  viewport: DEFAULT_VIEWPORT,
  documentGeneration: 0,
  imported: false,
  nodes: [createWorkflowNode('start', { x: 140, y: 132 })],
  edges: [],
  graphRevision: 0,
  history: { past: [], future: [] },
  pasteCount: 0,
  beginEdit: (kind) =>
    set((state) =>
      state.transaction?.kind === kind
        ? state
        : {
            history: finishTransaction(state),
            transaction: { kind, before: projectGraph(state), changed: false },
          },
    ),
  finishEdit: (kind) =>
    set((state) =>
      state.transaction?.kind === kind
        ? { history: finishTransaction(state), transaction: undefined }
        : state,
    ),
  undo: () =>
    set((state) => {
      const history = finishTransaction(state)
      const previous = history.past.at(-1)
      if (!previous) return state
      return restoreGraph(state, previous, {
        past: history.past.slice(0, -1),
        future: [...history.future, projectGraph(state)],
      })
    }),
  redo: () =>
    set((state) => {
      const history = finishTransaction(state)
      const next = history.future.at(-1)
      if (!next) return state
      return restoreGraph(state, next, {
        past: [...history.past, projectGraph(state)],
        future: history.future.slice(0, -1),
      })
    }),
  canUndo: () => selectCanUndo(get()),
  canRedo: () => selectCanRedo(get()),
  clearHistory: () =>
    set({ history: { past: [], future: [] }, transaction: undefined }),
  copySelection: () =>
    set((state) => {
      const clipboard = copyGraph(state.nodes, state.edges)
      return clipboard ? { clipboard, pasteCount: 0 } : state
    }),
  paste: () =>
    set((state) => {
      const { clipboard, nodes, edges, pasteCount } = state
      if (
        !clipboard ||
        nodes.length + clipboard.nodes.length > DOCUMENT_LIMITS.nodes ||
        edges.length + clipboard.edges.length > DOCUMENT_LIMITS.edges
      )
        return state
      const occupied = new Set([...nodes, ...edges].map(({ id }) => id))
      const pasted = duplicateGraph(clipboard, occupied, pasteCount + 1)
      if (!pasted) return state
      return {
        ...recordGraphEdit(state, {
          nodes: [
            ...nodes.map((node) =>
              node.selected ? { ...node, selected: false } : node,
            ),
            ...pasted.nodes,
          ],
          edges: [
            ...edges.map((edge) =>
              edge.selected ? { ...edge, selected: false } : edge,
            ),
            ...pasted.edges,
          ],
          graphRevision: state.graphRevision + 1,
        }),
        pasteCount: pasteCount + 1,
      }
    }),
  selectAll: () =>
    set((state) => ({
      ...(state.transaction?.kind === 'property'
        ? { history: finishTransaction(state), transaction: undefined }
        : {}),
      nodes: state.nodes.map((node) =>
        node.selected ? node : { ...node, selected: true },
      ),
      edges: state.edges.map((edge) =>
        edge.selected ? edge : { ...edge, selected: true },
      ),
    })),
  replaceDocument: (document, source) =>
    set((state) => {
      return {
        documentId: document.id,
        documentName: document.name,
        viewport: { ...document.viewport },
        nodes: document.nodes.map((node) => ({
          ...node,
          position: { ...node.position },
          data: { ...node.data },
        })),
        edges: document.edges.map((edge) => ({ ...edge })),
        graphRevision: state.graphRevision + 1,
        documentGeneration: state.documentGeneration + 1,
        imported: source === 'import',
        history: { past: [], future: [] },
        transaction: undefined,
      }
    }),
  updateViewport: (viewport) =>
    set((state) => {
      const previous = state.viewport
      return previous.x === viewport.x &&
        previous.y === viewport.y &&
        previous.zoom === viewport.zoom
        ? state
        : { viewport: { ...viewport } }
    }),
  addNode: (type, position) =>
    set((state) =>
      recordGraphEdit(state, {
        nodes: [...state.nodes, createWorkflowNode(type, position)],
        graphRevision: state.graphRevision + 1,
      }),
    ),
  updateNode: (id, changes) =>
    set((state) => {
      const { nodes } = state
      const node = nodes.find((item) => item.id === id)
      if (!node) return state
      const data = { ...node.data, ...changes }
      if (
        data.label === node.data.label &&
        data.description === node.data.description
      )
        return state
      return recordGraphEdit(
        state,
        {
          nodes: nodes.map((item) =>
            item === node ? { ...node, data } : item,
          ),
        },
        'property',
      )
    }),
  addEdge: (connection) =>
    set((state) => {
      const { nodes, edges } = state
      if (!canConnect(connection, nodes, edges)) return state
      return recordGraphEdit(state, {
        edges: [...edges, { ...connection, id: crypto.randomUUID() }],
        graphRevision: state.graphRevision + 1,
      })
    }),
  selectNode: (id) =>
    set((state) => {
      if (!state.nodes.some((node) => node.id === id)) return state
      const selectionChanged = state.nodes.some(
        (node) => Boolean(node.selected) !== (node.id === id),
      )
      const hasSelectedEdges = state.edges.some((edge) => edge.selected)
      if (!selectionChanged && !hasSelectedEdges) return state

      return {
        ...(selectionChanged && state.transaction?.kind === 'property'
          ? { history: finishTransaction(state), transaction: undefined }
          : {}),
        nodes: selectionChanged
          ? state.nodes.map((node) => {
              const selected = node.id === id
              return Boolean(node.selected) === selected
                ? node
                : { ...node, selected }
            })
          : state.nodes,
        edges: hasSelectedEdges
          ? state.edges.map((edge) =>
              edge.selected ? { ...edge, selected: false } : edge,
            )
          : state.edges,
      }
    }),
  removeSelection: () =>
    set((state) => {
      const selectedNodes = new Set(selectSelectedNodeIds(state))
      const selectedEdges = new Set(selectSelectedEdgeIds(state))
      const removedNodes = new Set(
        state.nodes
          .filter(
            (node) => node.deletable !== false && selectedNodes.has(node.id),
          )
          .map((node) => node.id),
      )
      if (!removedNodes.size && !selectedEdges.size) return state

      const edges = selectedEdges.size
        ? state.edges.filter((edge) => !selectedEdges.has(edge.id))
        : state.edges
      return recordGraphEdit(state, {
        nodes: removedNodes.size
          ? state.nodes.filter((node) => !removedNodes.has(node.id))
          : state.nodes,
        edges: removeIncidentEdges(edges, removedNodes),
        graphRevision: state.graphRevision + 1,
      })
    }),
  applyNodeChanges: (changes) =>
    set((state) => {
      const { nodes, edges, graphRevision } = state
      const allowed = changes.toArray().filter((change) => {
        if (change.type === 'add' || change.type === 'replace') return false
        return (
          change.type !== 'remove' ||
          nodes.some(
            (node) => node.id === change.id && node.deletable !== false,
          )
        )
      })
      if (!allowed.length) return state

      const removedNodes = new Set(
        allowed.flatMap((change) =>
          change.type === 'remove' ? [change.id] : [],
        ),
      )
      const nextNodes = new NodeChangeset<WorkflowNode>(allowed).applyTo(nodes)
      const patch = {
        nodes: nextNodes,
        edges: removeIncidentEdges(edges, removedNodes),
        graphRevision: removedNodes.size ? graphRevision + 1 : graphRevision,
      }
      if (removedNodes.size) return recordGraphEdit(state, patch)
      if (
        allowed.some((change) => change.type === 'position') &&
        nextNodes.some(
          (node, index) =>
            node.position.x !== nodes[index].position.x ||
            node.position.y !== nodes[index].position.y,
        )
      )
        return recordGraphEdit(state, patch, 'drag')
      if (
        state.transaction?.kind === 'property' &&
        allowed.some((change) => change.type === 'select')
      ) {
        return {
          ...patch,
          history: finishTransaction(state),
          transaction: undefined,
        }
      }
      return patch
    }),
  applyEdgeChanges: (changes) =>
    set((state) => {
      const { edges, graphRevision } = state
      const allowed = changes
        .toArray()
        .filter(
          (change) => change.type === 'select' || change.type === 'remove',
        )
      if (!allowed.length) return state
      const nextEdges = new EdgeChangeset<WorkflowEdge>(allowed).applyTo(edges)
      return nextEdges.length !== edges.length
        ? recordGraphEdit(state, {
            edges: nextEdges,
            graphRevision: graphRevision + 1,
          })
        : { edges: nextEdges }
    }),
}))
