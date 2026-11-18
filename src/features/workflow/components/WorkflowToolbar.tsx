export function WorkflowToolbar() {
  return (
    <header className="toolbar flex items-center gap-4">
      <div className="flex items-center gap-2.5 font-semibold">
        <span className="brand-mark" aria-hidden="true">
          ↳
        </span>
        FlowForge
      </div>
      <h1 className="workflow-title">Untitled workflow</h1>
    </header>
  )
}
