const nodeTypes = [
  { name: 'Start', symbol: '▷', tone: 'start', description: 'Entry point' },
  {
    name: 'Action',
    symbol: '↗',
    tone: 'action',
    description: 'Perform a task',
  },
  {
    name: 'Condition',
    symbol: '◇',
    tone: 'condition',
    description: 'Branch by a rule',
  },
  { name: 'End', symbol: '□', tone: 'end', description: 'Exit point' },
]

export function NodePalette() {
  return (
    <aside className="panel palette" aria-labelledby="palette-title">
      <div className="panel-heading">
        <h2 id="palette-title">Node palette</h2>
        <p>Node editing is planned for a future phase.</p>
      </div>
      <ul className="node-list">
        {nodeTypes.map(({ name, symbol, tone, description }) => (
          <li key={name} className="node-card flex items-center gap-3">
            <span
              className={`node-symbol node-symbol--${tone}`}
              aria-hidden="true"
            >
              {symbol}
            </span>
            <div>
              <div className="font-semibold">{name}</div>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
