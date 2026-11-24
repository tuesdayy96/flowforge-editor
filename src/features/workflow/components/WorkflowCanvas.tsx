import {
  selectSimulationLocked,
  useSimulationStore,
} from '../store/simulationStore'
import { useTranslation } from '@/shared/i18n'
import { useMemo, useState, type RefObject } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type IsValidConnection,
  type NodeOrigin,
} from '@xyflow/react'
import { canConnect } from '../domain/connection'
import { fitViewOptions, useEditorShortcuts } from '../hooks/useEditorShortcuts'
import { MAX_ZOOM, MIN_ZOOM } from '../model/workflowDocument'
import { isTextEditor } from '../services/editorShortcuts'
import { workflowNodeTypes } from '../nodes/WorkflowNodes'
import { useWorkflowStore } from '../store/workflowStore'

const nodeOrigin: NodeOrigin = [0.5, 0.5]
const beginDrag = () => useWorkflowStore.getState().beginEdit('drag')
const finishDrag = () => useWorkflowStore.getState().finishEdit('drag')

const isValidConnection: IsValidConnection = (connection) => {
  const { nodes, edges } = useWorkflowStore.getState()
  return canConnect(connection, nodes, edges)
}

export function WorkflowCanvas({
  surfaceRef,
  showMiniMap,
}: {
  surfaceRef: RefObject<HTMLDivElement | null>
  showMiniMap: boolean
}) {
  const t = useTranslation()
  const locked = useSimulationStore(selectSimulationLocked)
  useEditorShortcuts(surfaceRef)
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const { currentNodeId, error, visitedNodeIds, traversedEdgeIds } =
    useSimulationStore((state) => state.simulation)
  const visibleNodes = useMemo(() => {
    const visited = new Set(visitedNodeIds)
    return nodes.map((node) => {
      const status =
        node.id === currentNodeId
          ? error
            ? 'error'
            : 'current'
          : visited.has(node.id)
            ? 'visited'
            : undefined
      return status ? { ...node, className: `simulation-node-${status}` } : node
    })
  }, [nodes, currentNodeId, error, visitedNodeIds])
  const visibleEdges = useMemo(() => {
    const traversed = new Set(traversedEdgeIds)
    return edges.map((edge) => ({
      className: traversed.has(edge.id) ? 'simulation-edge' : undefined,
      ...edge,
      ariaLabel: t('flowEdgeLabel', {
        source: edge.source,
        target: edge.target,
      }),
    }))
  }, [edges, t, traversedEdgeIds])
  const addEdge = useWorkflowStore((state) => state.addEdge)
  const applyNodeChanges = useWorkflowStore((state) => state.applyNodeChanges)
  const applyEdgeChanges = useWorkflowStore((state) => state.applyEdgeChanges)
  const updateViewport = useWorkflowStore((state) => state.updateViewport)
  const [{ viewport: defaultViewport, documentGeneration: generation }] =
    useState(() => {
      const { viewport, documentGeneration } = useWorkflowStore.getState()
      return { viewport, documentGeneration }
    })

  return (
    <main className="canvas" aria-labelledby="canvas-title">
      <div className="canvas-heading">
        <h2 id="canvas-title">{t('canvas')}</h2>
        <p>{t('canvasHint')}</p>
      </div>
      <div
        ref={surfaceRef}
        className="canvas-surface"
        tabIndex={0}
        aria-label={t('editingArea')}
        onPointerDownCapture={(event) => {
          if (
            !isTextEditor(event.target) &&
            !(event.target instanceof Element && event.target.closest('button'))
          )
            event.currentTarget.focus({ preventScroll: true })
        }}
      >
        <ReactFlow
          ariaLabelConfig={{
            'controls.ariaLabel': t('controls'),
            'controls.zoomIn.ariaLabel': t('zoomIn'),
            'controls.zoomOut.ariaLabel': t('zoomOut'),
            'controls.fitView.ariaLabel': t('fit'),
            'node.a11yDescription.default': t('flowNodeHelp'),
            'edge.a11yDescription.default': t('flowEdgeHelp'),
            'node.a11yDescription.keyboardDisabled': t('flowNode'),
            'node.a11yDescription.ariaLiveMessage': ({ x, y }) =>
              t('flowMove', { x, y }),
            'handle.ariaLabel': t('flowEdge'),
          }}
          nodes={visibleNodes}
          nodesDraggable={!locked}
          nodesConnectable={!locked}
          disableKeyboardA11y={locked}
          edges={visibleEdges}
          defaultViewport={defaultViewport}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMove={(_event, viewport) => {
            if (useWorkflowStore.getState().documentGeneration === generation)
              updateViewport(viewport)
          }}
          nodeTypes={workflowNodeTypes}
          nodeOrigin={nodeOrigin}
          onNodesChange={applyNodeChanges}
          onEdgesChange={applyEdgeChanges}
          isValidConnection={isValidConnection}
          onConnect={addEdge}
          edgesReconnectable={false}
          onNodeDragStart={beginDrag}
          onNodeDragStop={finishDrag}
          onSelectionDragStart={beginDrag}
          onSelectionDragStop={finishDrag}
          deleteKeyCode={null}
          forceColorMode="light"
        >
          <Background gap={22} size={1.25} color="var(--canvas-dot)" />
          <Controls
            position="bottom-left"
            showInteractive={false}
            fitViewOptions={fitViewOptions}
          />
          {showMiniMap && (
            <MiniMap
              pannable
              zoomable
              ariaLabel={t('mapLabel')}
              nodeColor={(node) => `var(--${node.type ?? 'muted'})`}
            />
          )}
        </ReactFlow>
      </div>
    </main>
  )
}
