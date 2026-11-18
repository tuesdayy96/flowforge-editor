import { EdgeChangeset, NodeChangeset, type XYPosition } from '@xyflow/react'
import { create } from 'zustand'
import {
  canConnect,
  type WorkflowConnection,
  type WorkflowNodeType,
} from '../domain/connection'
import {
  DEFAULT_VIEWPORT,
  type WorkflowDocument,
} from '../model/workflowDocument'
import {
  createWorkflowNode,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeData,
} from '../model/workflowNode'

interface WorkflowState {
  documentId: string
  documentName: string
  viewport: WorkflowDocument['viewport']
  documentGeneration: number
  imported: boolean
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  graphRevision: number
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

export const useWorkflowStore = create<WorkflowState>()((set) => ({
  documentId: crypto.randomUUID(),
  documentName: 'Untitled workflow',
  viewport: DEFAULT_VIEWPORT,
  documentGeneration: 0,
  imported: false,
  nodes: [createWorkflowNode('start', { x: 140, y: 132 })],
  edges: [],
  graphRevision: 0,
  replaceDocument: (document, source) =>
    set((state) => {
      const firstStart = document.nodes.find((node) => node.type === 'start')
      return {
        documentId: document.id,
        documentName: document.name,
        viewport: { ...document.viewport },
        nodes: document.nodes.map((node) => ({
          ...node,
          position: { ...node.position },
          data: { ...node.data },
          deletable: node !== firstStart,
        })),
        edges: document.edges.map((edge) => ({ ...edge })),
        graphRevision: state.graphRevision + 1,
        documentGeneration: state.documentGeneration + 1,
        imported: source === 'import',
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
    set((state) => {
      if (type === 'start' && state.nodes.some((node) => node.type === 'start'))
        return state
      return {
        nodes: [...state.nodes, createWorkflowNode(type, position)],
        graphRevision: state.graphRevision + 1,
      }
    }),
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
      return {
        nodes: nodes.map((item) => (item === node ? { ...node, data } : item)),
      }
    }),
  addEdge: (connection) =>
    set((state) => {
      const { nodes, edges } = state
      if (!canConnect(connection, nodes, edges)) return state
      return {
        edges: [...edges, { ...connection, id: crypto.randomUUID() }],
        graphRevision: state.graphRevision + 1,
      }
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
      return {
        nodes: removedNodes.size
          ? state.nodes.filter((node) => !removedNodes.has(node.id))
          : state.nodes,
        edges: removeIncidentEdges(edges, removedNodes),
        graphRevision: state.graphRevision + 1,
      }
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
      return {
        nodes: new NodeChangeset<WorkflowNode>(allowed).applyTo(nodes),
        edges: removeIncidentEdges(edges, removedNodes),
        graphRevision: removedNodes.size ? graphRevision + 1 : graphRevision,
      }
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
      return {
        edges: nextEdges,
        graphRevision:
          nextEdges.length !== edges.length ? graphRevision + 1 : graphRevision,
      }
    }),
}))
