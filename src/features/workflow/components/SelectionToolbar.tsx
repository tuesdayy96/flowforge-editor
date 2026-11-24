import {
  NodeToolbar,
  Position,
  useOptionsStore,
  useReactFlow,
  useViewport,
} from '@xyflow/react'
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTranslation } from '@/shared/i18n'
import {
  selectSimulationLocked,
  useSimulationStore,
} from '../store/simulationStore'
import { selectSelectedNodeIds, useWorkflowStore } from '../store/workflowStore'

export function SelectionToolbar({
  surfaceRef,
  openMenu,
  expanded,
}: {
  surfaceRef: RefObject<HTMLDivElement | null>
  openMenu: (anchor: HTMLButtonElement) => void
  expanded: boolean
}) {
  const t = useTranslation()
  const selected = useWorkflowStore(useShallow(selectSelectedNodeIds))
  const dragging = useWorkflowStore(
    (state) => state.transaction?.kind === 'drag',
  )
  const locked = useSimulationStore(selectSimulationLocked)
  const canRemove = useWorkflowStore(({ nodes }) =>
    nodes.some((node) => node.selected && node.deletable !== false),
  )
  const selecting = useOptionsStore((state) => state.userSelectionActive)
  if (!selected.length || dragging || selecting) return null
  const group = selected.length > 1
  return (
    <NodeToolbar
      nodeId={selected}
      isVisible
      position={Position.Top}
      offset={12}
      className="nopan nodrag"
    >
      <ClampedToolbar
        surfaceRef={surfaceRef}
        selected={selected}
        label={t(group ? 'groupActions' : 'nodeActions')}
      >
        <button
          type="button"
          onClick={() => useWorkflowStore.getState().copySelection()}
        >
          {t(group ? 'copySelected' : 'copy')}
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => useWorkflowStore.getState().duplicateSelection()}
        >
          {t(group ? 'duplicateSelected' : 'duplicate')}
        </button>
        <button
          type="button"
          disabled={locked || !canRemove}
          className="context-danger"
          onClick={() => {
            surfaceRef.current?.focus({ preventScroll: true })
            useWorkflowStore.getState().removeNodes(selected)
          }}
        >
          {t(group ? 'deleteSelected' : 'deleteNode')}
        </button>
        <button
          type="button"
          aria-label={t('moreActions')}
          aria-haspopup="menu"
          aria-expanded={expanded}
          onClick={(event) => openMenu(event.currentTarget)}
        >
          ⋯
        </button>
      </ClampedToolbar>
    </NodeToolbar>
  )
}

function ClampedToolbar({
  surfaceRef,
  selected,
  label,
  children,
}: {
  surfaceRef: RefObject<HTMLDivElement | null>
  selected: string[]
  label: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const viewport = useViewport()
  const { getNodesBounds } = useReactFlow()
  useLayoutEffect(() => {
    const surface = surfaceRef.current
    const bar = ref.current
    if (!surface || !bar) return
    function constrain() {
      if (!surface || !bar) return
      bar.style.translate = ''
      const area = surface.getBoundingClientRect()
      bar.style.maxWidth = `${Math.max(0, area.width - 16)}px`
      const rect = bar.getBoundingClientRect()
      const bounds = getNodesBounds(selected)
      const left = area.left + viewport.x + bounds.x * viewport.zoom
      const top = area.top + viewport.y + bounds.y * viewport.zoom
      const right = left + bounds.width * viewport.zoom
      const bottom = top + bounds.height * viewport.zoom
      bar.style.visibility =
        right < area.left ||
        left > area.right ||
        bottom < area.top ||
        top > area.bottom
          ? 'hidden'
          : ''
      const x = Math.max(
        area.left + 8,
        Math.min(rect.left, area.right - rect.width - 8),
      )
      const below = bottom + 12
      const y =
        rect.top < area.top + 8 && below + rect.height <= area.bottom - 8
          ? below
          : Math.max(
              area.top + 8,
              Math.min(rect.top, area.bottom - rect.height - 8),
            )
      bar.style.translate = `${x - rect.left}px ${y - rect.top}px`
    }
    constrain()
    const resize = new ResizeObserver(constrain)
    resize.observe(surface)
    resize.observe(bar)
    const placement = new MutationObserver(constrain)
    if (bar.parentElement)
      placement.observe(bar.parentElement, {
        attributes: true,
        attributeFilter: ['style'],
      })
    return () => {
      placement.disconnect()
      resize.disconnect()
    }
  }, [getNodesBounds, selected, surfaceRef, viewport])

  return (
    <div
      ref={ref}
      className="selection-toolbar"
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}
