export function PropertyInspector() {
  return (
    <aside className="panel inspector" aria-labelledby="inspector-title">
      <div className="panel-heading">
        <h2 id="inspector-title">Properties</h2>
      </div>
      <div className="inspector-empty">
        <h3>No node selected</h3>
        <p>
          Node properties will appear here when node editing becomes available.
        </p>
      </div>
    </aside>
  )
}
