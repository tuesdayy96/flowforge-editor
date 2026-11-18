import { EdgeChangeset, NodeChangeset, type XYPosition } from '@xyflow/react'
import { create } from 'zustand'
import { canConnect, type WorkflowConnection } from '../domain/connection'
import {
  createWorkflowNode,
  type AddableNodeType,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeData,
} from '../model/workflowNode'

interface WorkflowState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  graphRevision: number
  addNode: (type: AddableNodeType, position: XYPosition) => void
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
  nodes: [createWorkflowNode('start', { x: 140, y: 132 })],
  edges: [],
  graphRevision: 0,
  addNode: (type, position) =>
    set(({ nodes, graphRevision }) => ({
      nodes: [...nodes, createWorkflowNode(type, position)],
      graphRevision: graphRevision + 1,
    })),
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
