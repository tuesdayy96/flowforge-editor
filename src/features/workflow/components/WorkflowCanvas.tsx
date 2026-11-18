import { Background, Controls, ReactFlow } from '@xyflow/react'

export function WorkflowCanvas() {
  return (
    <main className="canvas" aria-labelledby="canvas-title">
      <div className="canvas-heading">
        <h2 id="canvas-title">Workflow canvas</h2>
        <p>Drag to pan. Scroll to zoom.</p>
      </div>
      <div className="canvas-surface">
        <ReactFlow
          defaultNodes={[]}
          defaultEdges={[]}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          panActivationKeyCode={null}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          zoomActivationKeyCode={null}
          forceColorMode="light"
        >
          <Background gap={22} size={1.25} color="var(--canvas-dot)" />
          <Controls
            position="bottom-left"
            showInteractive={false}
            showFitView={false}
          />
        </ReactFlow>
        <div className="canvas-empty">
          <p className="font-semibold">Empty workflow</p>
          <p>No nodes on the canvas.</p>
        </div>
      </div>
    </main>
  )
}
