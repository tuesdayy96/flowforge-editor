import { canConnect } from '../domain/connection'
import {
  projectGraph,
  type GraphSnapshot,
  type WorkflowEdge,
  type WorkflowNode,
} from './workflowNode'

const PASTE_OFFSET = 32

export function copyGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const selected = nodes.filter((node) => node.selected)
  if (!selected.length) return
  const ids = new Set(selected.map((node) => node.id))
  return projectGraph({
    nodes: selected,
    edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
  })
}

export function duplicateGraph(
  clipboard: GraphSnapshot,
  occupied: Set<string>,
  pasteNumber: number,
) {
  const ids = new Map<string, string>()
  function nextId() {
    let id = crypto.randomUUID()
    while (occupied.has(id)) id = crypto.randomUUID()
    occupied.add(id)
    return id
  }

  const offset = pasteNumber * PASTE_OFFSET
  const nodes = clipboard.nodes.map((node) => {
    const id = nextId()
    ids.set(node.id, id)
    return {
      ...node,
      id,
      position: { x: node.position.x + offset, y: node.position.y + offset },
      data: { ...node.data },
      selected: true,
    }
  })

  const edges: WorkflowEdge[] = []
  for (const edge of clipboard.edges) {
    const source = ids.get(edge.source)
    const target = ids.get(edge.target)
    if (source === undefined || target === undefined) return
    const connection = { ...edge, source, target }
    if (!canConnect(connection, nodes, edges)) return
    edges.push({ ...connection, id: nextId() })
  }
  return { nodes, edges }
}
