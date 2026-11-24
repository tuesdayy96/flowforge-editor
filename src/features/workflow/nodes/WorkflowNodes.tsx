import { usePreferences, useTranslation } from '@/shared/i18n'
import { Handle, Position, type NodeProps, type NodeTypes } from '@xyflow/react'
import { formatCondition } from '../model/workflowCondition'
import { workflowPorts } from '../domain/connection'
import { nodeLabels, type WorkflowNode } from '../model/workflowNode'

function NodeCard({ data, type }: NodeProps<WorkflowNode>) {
  const t = useTranslation()
  const { input, outputs } = workflowPorts[type]

  return (
    <article className={`workflow-node workflow-node--${type}`}>
      {input && (
        <Handle
          type="target"
          id={input}
          position={Position.Left}
          aria-label={t(type === 'merge' ? 'multiInput' : 'input')}
        />
      )}
      <span className={`workflow-node-type node-symbol--${type}`}>
        {nodeLabels[type]}
      </span>
      <h3>{data.label.trim() || nodeLabels[type]}</h3>
      {data.description && <p>{data.description}</p>}
      {type === 'condition' ? (
        <div>
          <ConditionSummary condition={data.condition} />
          <div className="workflow-branches">
            {outputs.map((id) => (
              <div
                key={id}
                className={`workflow-branch workflow-branch--${id}`}
              >
                {id}
                <Handle
                  type="source"
                  id={id}
                  position={Position.Right}
                  aria-label={t('branchOutput', { output: id })}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        outputs.map((id) => (
          <Handle
            key={id}
            type="source"
            id={id}
            position={Position.Right}
            aria-label={t('output')}
          />
        ))
      )}
    </article>
  )
}

function ConditionSummary({
  condition,
}: {
  condition: WorkflowNode['data']['condition']
}) {
  const locale = usePreferences((state) => state.locale)
  const t = useTranslation()
  const summary = condition
    ? formatCondition(condition, locale)
    : t('conditionUnset')
  return (
    <p className="workflow-condition-summary" title={summary}>
      {summary}
    </p>
  )
}

function StartNode(props: NodeProps<WorkflowNode>) {
  return <NodeCard {...props} />
}

function ActionNode(props: NodeProps<WorkflowNode>) {
  return <NodeCard {...props} />
}

function ConditionNode(props: NodeProps<WorkflowNode>) {
  return <NodeCard {...props} />
}

function EndNode(props: NodeProps<WorkflowNode>) {
  return <NodeCard {...props} />
}

function MergeNode(props: NodeProps<WorkflowNode>) {
  return <NodeCard {...props} />
}

export const workflowNodeTypes = {
  start: StartNode,
  action: ActionNode,
  condition: ConditionNode,
  merge: MergeNode,
  end: EndNode,
} satisfies NodeTypes
