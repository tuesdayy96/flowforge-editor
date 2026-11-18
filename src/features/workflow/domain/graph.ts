export interface GraphLink {
  source: string
  target: string
}

export function buildAdjacency(links: readonly GraphLink[], reverse = false) {
  const adjacency = new Map<string, string[]>()
  for (const link of links) {
    const from = reverse ? link.target : link.source
    const to = reverse ? link.source : link.target
    const neighbors = adjacency.get(from)
    if (neighbors) neighbors.push(to)
    else adjacency.set(from, [to])
  }
  return adjacency
}

export function reachableFrom(
  roots: readonly string[],
  adjacency: ReadonlyMap<string, readonly string[]>,
) {
  const visited = new Set(roots)
  const pending = [...visited]
  while (pending.length) {
    const current = pending.pop()!
    for (const neighbor of adjacency.get(current) ?? []) {
      if (visited.has(neighbor)) continue
      visited.add(neighbor)
      pending.push(neighbor)
    }
  }
  return visited
}

export function findCycleNode(
  nodeIds: Iterable<string>,
  adjacency: ReadonlyMap<string, readonly string[]>,
): string | undefined {
  const states = new Map<string, 'visiting' | 'done'>()
  for (const root of nodeIds) {
    if (states.has(root)) continue
    states.set(root, 'visiting')
    const stack = [
      { id: root, neighbors: (adjacency.get(root) ?? []).values() },
    ]

    while (stack.length) {
      const frame = stack[stack.length - 1]
      const next = frame.neighbors.next()
      if (next.done) {
        states.set(frame.id, 'done')
        stack.pop()
        continue
      }

      const state = states.get(next.value)
      if (state === 'visiting') return next.value
      if (state !== 'done') {
        states.set(next.value, 'visiting')
        stack.push({
          id: next.value,
          neighbors: (adjacency.get(next.value) ?? []).values(),
        })
      }
    }
  }
  return undefined
}
