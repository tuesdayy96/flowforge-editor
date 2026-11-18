import { useState, type RefObject } from 'react'
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
  useEditorShortcuts(surfaceRef)
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
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
        <h2 id="canvas-title">Workflow canvas</h2>
        <p>Drag to pan. Scroll to zoom. Shift-drag to select multiple nodes.</p>
      </div>
      <div
        ref={surfaceRef}
        className="canvas-surface"
        tabIndex={0}
        aria-label="Workflow editing area"
        onPointerDownCapture={(event) => {
          if (
            !isTextEditor(event.target) &&
            !(event.target instanceof Element && event.target.closest('button'))
          )
            event.currentTarget.focus({ preventScroll: true })
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
              ariaLabel="Workflow minimap"
              nodeColor={(node) => `var(--${node.type ?? 'muted'})`}
            />
          )}
        </ReactFlow>
      </div>
    </main>
  )
}
