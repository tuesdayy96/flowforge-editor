import { Handle, Position, type NodeProps, type NodeTypes } from '@xyflow/react'
import { workflowPorts } from '../domain/connection'
import { nodeLabels, type WorkflowNode } from '../model/workflowNode'

function NodeCard({ data, type }: NodeProps<WorkflowNode>) {
  const { input, outputs } = workflowPorts[type]

  return (
    <article className={`workflow-node workflow-node--${type}`}>
      {input && (
        <Handle
          type="target"
          id={input}
          position={Position.Left}
          aria-label="Input"
        />
      )}
      <span className={`workflow-node-type node-symbol--${type}`}>
        {nodeLabels[type]}
      </span>
      <h3>{data.label.trim() || nodeLabels[type]}</h3>
      {data.description && <p>{data.description}</p>}
      {type === 'condition' ? (
        <div className="workflow-branches">
          {outputs.map((id) => (
            <div key={id} className={`workflow-branch workflow-branch--${id}`}>
              {id}
              <Handle
                type="source"
                id={id}
                position={Position.Right}
                aria-label={`${id} output`}
              />
            </div>
          ))}
        </div>
      ) : (
        outputs.map((id) => (
          <Handle
            key={id}
            type="source"
            id={id}
            position={Position.Right}
            aria-label="Output"
          />
        ))
      )}
    </article>
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

export const workflowNodeTypes = {
  start: StartNode,
  action: ActionNode,
  condition: ConditionNode,
  end: EndNode,
} satisfies NodeTypes
