import { useReactFlow } from '@xyflow/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTranslation } from '@/shared/i18n'
import type { MenuItem } from '../components/ContextMenu'
import { isTextEditor } from '../services/editorShortcuts'
import {
  isEditingLocked,
  selectSimulationLocked,
  useSimulationStore,
} from '../store/simulationStore'
import {
  selectCanRedo,
  selectCanUndo,
  selectSelectedNodeIds,
  useWorkflowStore,
} from '../store/workflowStore'
import { fitViewOptions } from './useEditorShortcuts'

type Target =
  | { kind: 'canvas' }
  | { kind: 'edge'; id: string }
  | { kind: 'nodes'; ids: string[] }
type Menu = Target & {
  x: number
  y: number
  fromMore: boolean
  sequence: number
  toggleAnchor: HTMLElement | SVGElement | null
}
type ContextEvent = {
  clientX: number
  clientY: number
  target: EventTarget | null
  preventDefault: () => void
  stopPropagation: () => void
}

function sameNodes(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, index) => b[index] === id)
}

export function useCanvasMenu(
  surfaceRef: RefObject<HTMLDivElement | null>,
  editProperties: () => void,
) {
  const t = useTranslation()
  const { fitView, screenToFlowPosition } = useReactFlow()
  const [menu, setMenu] = useState<Menu>()
  const opener = useRef<HTMLElement | SVGElement | null>(null)
  const sequence = useRef(0)
  const locked = useSimulationStore(selectSimulationLocked)
  const selected = useWorkflowStore(useShallow(selectSelectedNodeIds))
  const canRemoveNodes = useWorkflowStore(({ nodes }) =>
    nodes.some((node) => node.selected && node.deletable !== false),
  )
  const canUndo = useWorkflowStore(selectCanUndo)
  const canRedo = useWorkflowStore(selectCanRedo)
  const canPaste = useWorkflowStore(({ clipboard }) =>
    Boolean(clipboard?.nodes.length),
  )
  const hasElements = useWorkflowStore(({ nodes, edges }) =>
    Boolean(nodes.length || edges.length),
  )
  const edgeExists = useWorkflowStore(
    ({ edges }) =>
      menu?.kind === 'edge' && edges.some(({ id }) => id === menu.id),
  )

  const close = useCallback(
    (restoreFocus = false) => {
      setMenu(undefined)
      if (restoreFocus) {
        const target = opener.current
        if (target?.isConnected) target.focus({ preventScroll: true })
        if (!surfaceRef.current?.contains(document.activeElement))
          surfaceRef.current?.focus({ preventScroll: true })
      }
      opener.current = null
    },
    [surfaceRef],
  )

  useEffect(() => {
    if (!menu || menu.kind === 'canvas') return
    const target = menu
    return useWorkflowStore.subscribe((state) => {
      const valid =
        target.kind === 'edge'
          ? state.edges.some(({ id }) => id === target.id)
          : sameNodes(target.ids, selectSelectedNodeIds(state))
      if (!valid)
        setMenu((current) => (current === target ? undefined : current))
    })
  }, [menu])

  function open(
    target: Target,
    x: number,
    y: number,
    anchor: HTMLElement | SVGElement | null,
    fromMore = false,
  ) {
    opener.current = anchor
    setMenu({
      ...target,
      x,
      y,
      fromMore,
      sequence: ++sequence.current,
      toggleAnchor: fromMore ? anchor : null,
    })
  }

  function resolveNode(id: string): Target {
    const state = useWorkflowStore.getState()
    const ids = selectSelectedNodeIds(state)
    if (ids.includes(id)) return { kind: 'nodes', ids }
    state.selectNode(id)
    return { kind: 'nodes', ids: [id] }
  }

  function context(event: ContextEvent, target: Target | (() => Target)) {
    if (isTextEditor(event.target)) return
    const selection = window.getSelection()
    if (
      !selection?.isCollapsed &&
      event.target instanceof Node &&
      selection?.containsNode(event.target, true)
    )
      return
    event.preventDefault()
    event.stopPropagation()
    const element =
      event.target instanceof Element
        ? event.target.closest<HTMLElement | SVGElement>(
            '.react-flow__node, .react-flow__edge, .react-flow__nodesselection-rect',
          )
        : null
    open(
      typeof target === 'function' ? target() : target,
      event.clientX,
      event.clientY,
      element ?? surfaceRef.current,
    )
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(
      event.key === 'ContextMenu' ||
      (event.shiftKey && event.key === 'F10')
    ))
      return
    if (
      !(event.target instanceof Element) ||
      isTextEditor(event.target) ||
      event.target.closest('button')
    )
      return
    const node = event.target.closest<HTMLElement>('.react-flow__node')
    const edge = event.target.closest<SVGElement>('.react-flow__edge')
    const group = event.target.closest<HTMLElement>(
      '.react-flow__nodesselection-rect',
    )
    const anchor = node ?? edge ?? group ?? surfaceRef.current
    if (!anchor) return
    event.preventDefault()
    event.stopPropagation()
    const rect = anchor.getBoundingClientRect()
    let target: Target = { kind: 'canvas' }
    if (node?.dataset.id) target = resolveNode(node.dataset.id)
    else if (edge?.dataset.id) target = { kind: 'edge', id: edge.dataset.id }
    else if (group && selected.length) target = { kind: 'nodes', ids: selected }
    open(target, rect.left + rect.width / 2, rect.top + rect.height / 2, anchor)
  }

  function more(anchor: HTMLButtonElement) {
    if (menu?.fromMore) {
      close(true)
      return
    }
    const ids = selectSelectedNodeIds(useWorkflowStore.getState())
    if (!ids.length) return
    const rect = anchor.getBoundingClientRect()
    open({ kind: 'nodes', ids }, rect.left, rect.bottom + 6, anchor, true)
  }

  function itemsFor(target: Menu): { label: string; items: MenuItem[] } {
    const state = useWorkflowStore.getState()
    if (target.kind === 'canvas')
      return {
        label: t('canvasMenu'),
        items: [
          {
            label: t('paste'),
            icon: '▤',
            shortcut: 'Ctrl/Cmd+V',
            disabled: locked || !canPaste,
            execute: () =>
              state.paste(
                screenToFlowPosition(
                  { x: target.x, y: target.y },
                  { snapToGrid: false },
                ),
              ),
          },
          {
            label: t('selectAll'),
            icon: '□',
            shortcut: 'Ctrl/Cmd+A',
            disabled: !hasElements,
            execute: state.selectAll,
          },
          {
            label: t('undo'),
            icon: '↶',
            shortcut: 'Ctrl/Cmd+Z',
            disabled: locked || !canUndo,
            execute: state.undo,
            divider: true,
          },
          {
            label: t('redo'),
            icon: '↷',
            shortcut: 'Ctrl/Cmd+Shift+Z',
            disabled: locked || !canRedo,
            execute: state.redo,
          },
          {
            label: t('fit'),
            icon: '⛶',
            shortcut: 'Ctrl/Cmd+0',
            execute: () => void fitView(fitViewOptions),
            divider: true,
          },
        ],
      }
    if (target.kind === 'edge')
      return {
        label: t('edgeMenu'),
        items: [
          {
            label: t('deleteConnection'),
            icon: '×',
            danger: true,
            disabled: locked,
            execute: () => state.removeEdge(target.id),
          },
        ],
      }
    const group = target.ids.length > 1
    const withinSelection = (action: () => void) => () => {
      if (
        sameNodes(
          target.ids,
          selectSelectedNodeIds(useWorkflowStore.getState()),
        )
      )
        action()
    }
    const items: MenuItem[] = [
      {
        label: t(group ? 'copySelected' : 'copy'),
        icon: '▣',
        shortcut: 'Ctrl/Cmd+C',
        execute: withinSelection(state.copySelection),
      },
      {
        label: t(group ? 'duplicateSelected' : 'duplicate'),
        icon: '⊞',
        disabled: locked,
        execute: withinSelection(state.duplicateSelection),
      },
      {
        label: t(group ? 'deleteSelected' : 'deleteNode'),
        icon: '×',
        danger: true,
        disabled: locked || !canRemoveNodes,
        execute: withinSelection(() => state.removeNodes(target.ids)),
        divider: true,
      },
    ]
    if (!group)
      items.unshift({
        label: t('editProperties'),
        icon: '✎',
        disabled: locked,
        execute: withinSelection(() => {
          if (!isEditingLocked()) editProperties()
        }),
      })
    return { label: t(group ? 'groupMenu' : 'nodeMenu'), items }
  }

  const active =
    menu &&
    (menu.kind === 'canvas' ||
      (menu.kind === 'edge' ? edgeExists : sameNodes(menu.ids, selected)))
      ? menu
      : undefined

  return {
    menu: active && { ...active, ...itemsFor(active) },
    close,
    more,
    onKeyDown,
    nodeContext: (event: ContextEvent, id: string) =>
      context(event, () => resolveNode(id)),
    edgeContext: (event: ContextEvent, id: string) =>
      context(event, { kind: 'edge', id }),
    paneContext: (event: ContextEvent) => context(event, { kind: 'canvas' }),
    selectionContext: (event: ContextEvent) => {
      const ids = selectSelectedNodeIds(useWorkflowStore.getState())
      if (ids.length) context(event, { kind: 'nodes', ids })
    },
  }
}
