import { SimulationInputEditor } from './SimulationInputEditor'
import { useId, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useTranslation } from '@/shared/i18n'
import { fitViewOptions } from '../hooks/useEditorShortcuts'
import { nodeLabels, projectGraph } from '../model/workflowNode'
import { isSimulationActive } from '../domain/simulation'
import { useSimulationStore } from '../store/simulationStore'
import { useWorkflowStore } from '../store/workflowStore'

export function Simulator({
  speed,
  setSpeed,
}: {
  speed: number
  setSpeed: (speed: number) => void
}) {
  const t = useTranslation()
  const id = useId()
  const { fitView } = useReactFlow()
  const nodes = useWorkflowStore((state) => state.nodes)
  const { simulation, start, step, run, pause, stop, reset } =
    useSimulationStore()
  const locked = isSimulationActive(simulation.status)
  const [selectedStart, setSelectedStart] = useState('')
  const [mode, setMode] = useState<'form' | 'json'>('form')
  const [draft, setDraft] = useState<string>()
  const starts = nodes.filter((node) => node.type === 'start')
  const startId = starts.some((node) => node.id === selectedStart)
    ? selectedStart
    : starts[0]?.id
  const { status, log, error, currentNodeId, visitedNodeIds } = simulation
  const current = nodes.find((node) => node.id === currentNodeId)
  const canStep = status === 'ready' || status === 'paused'

  return (
    <section
      aria-label={t('simulation')}
      className="simulation inspector-fields"
    >
      <p className="simulation-status" role="status">
        <strong>{t(`sim_${status}`)}</strong>
        {current && (
          <span> · {current.data.label || nodeLabels[current.type]}</span>
        )}
        {locked && <span className="simulation-hint">{t('simLocked')}</span>}
      </p>
      <label htmlFor={`${id}-start`}>{t('simStartNode')}</label>
      <select
        id={`${id}-start`}
        value={startId ?? ''}
        disabled={locked || !starts.length}
        onChange={(event) => setSelectedStart(event.target.value)}
      >
        {!starts.length && <option value="">{t('simNoStart')}</option>}
        {starts.map((node) => (
          <option key={node.id} value={node.id}>
            {node.data.label || nodeLabels.start} · {node.id}
          </option>
        ))}
      </select>
      <SimulationInputEditor
        locked={locked}
        mode={mode}
        setMode={setMode}
        draft={draft}
        setDraft={setDraft}
      />
      <label htmlFor={`${id}-speed`}>{t('simSpeed')}</label>
      <select
        id={`${id}-speed`}
        value={speed}
        onChange={(event) => setSpeed(Number(event.target.value))}
      >
        <option value={1000}>{t('simSlow')}</option>
        <option value={500}>{t('simNormal')}</option>
        <option value={200}>{t('simFast')}</option>
      </select>
      <div className="simulation-actions simulation-run-controls">
        <RunControl
          icon="⚑"
          label={t('simStart')}
          disabled={
            locked || !startId || (mode === 'json' && draft !== undefined)
          }
          onClick={() => {
            if (startId)
              start(projectGraph(useWorkflowStore.getState()), startId)
          }}
        />
        <RunControl
          icon="▸▏"
          label={t('simStep')}
          disabled={!canStep}
          onClick={step}
        />
        <RunControl
          icon="▶"
          label={t(status === 'paused' ? 'simResume' : 'simRun')}
          disabled={!canStep}
          onClick={run}
        />
        <RunControl
          icon="⏸︎"
          label={t('simPause')}
          disabled={status !== 'running'}
          onClick={pause}
        />
        <RunControl
          icon="■"
          label={t('simStop')}
          disabled={!locked}
          onClick={stop}
        />
        <RunControl
          icon="↺"
          label={t('simReset')}
          disabled={status === 'idle'}
          onClick={reset}
        />
      </div>
      {error && (
        <p role="alert" className="simulation-error">
          {t(`sim_${error}`)}
        </p>
      )}
      <h3>{t('simResult')}</h3>
      <p>
        {t('simSummary', {
          nodes: visitedNodeIds.length,
          edges: simulation.traversedEdgeIds.length,
        })}
      </p>
      <h3>{t('simLog')}</h3>
      {!log.length && <p className="simulation-hint">{t('simEmptyLog')}</p>}
      <ol className="simulation-log" aria-label={t('simLog')}>
        {log.map(({ step, node, result, error }) => (
          <li key={step}>
            <button
              type="button"
              title={node.id}
              disabled={!nodes.some(({ id }) => id === node.id)}
              onClick={() =>
                void fitView({ ...fitViewOptions, nodes: [{ id: node.id }] })
              }
            >
              <strong>
                {step}. {nodeLabels[node.type]} · {node.data.label || node.id}
              </strong>
              <small>{node.id}</small>
              <span>
                {error
                  ? t(`sim_${error}`)
                  : t(`sim_event_${node.type}`, { result: String(result) })}
              </span>
              {error && result !== undefined && (
                <span>
                  {t('sim_event_condition', { result: String(result) })}
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

function RunControl({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <span className="simulation-run-control">
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
      <span className="simulation-run-tooltip" aria-hidden="true">
        {label}
      </span>
    </span>
  )
}
