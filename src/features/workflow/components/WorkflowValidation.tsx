import { useReactFlow } from '@xyflow/react'
import type { ValidationIssue, ValidationResult } from '../domain/validation'
import { nodeLabels } from '../model/workflowNode'
import { useWorkflowStore } from '../store/workflowStore'

function IssueLocation({ nodeId }: { nodeId: string }) {
  const label = useWorkflowStore(({ nodes }) => {
    const node = nodes.find((item) => item.id === nodeId)
    return node && (node.data.label.trim() || nodeLabels[node.type])
  })
  const { getZoom, setCenter } = useReactFlow()

  function locateNode() {
    const { nodes, selectNode } = useWorkflowStore.getState()
    const node = nodes.find((item) => item.id === nodeId)
    if (!node) return
    selectNode(nodeId)
    void setCenter(node.position.x, node.position.y, {
      zoom: getZoom(),
      duration: 200,
    })
  }

  return (
    label && (
      <button type="button" onClick={locateNode}>
        Locate {label}
      </button>
    )
  )
}

function IssueRow({ issue }: { issue: ValidationIssue }) {
  return (
    <li className="validation-issue">
      <span
        className={`validation-severity validation-severity--${issue.severity}`}
      >
        {issue.severity}
      </span>
      <span>{issue.message}</span>
      {issue.nodeId && <IssueLocation nodeId={issue.nodeId} />}
    </li>
  )
}

export function WorkflowValidation({
  result,
  revision,
  onClose,
}: {
  result: ValidationResult
  revision: number
  onClose: () => void
}) {
  const current = useWorkflowStore((state) => state.graphRevision === revision)
  const errors = result.issues.filter(
    (issue) => issue.severity === 'error',
  ).length
  const warnings = result.issues.length - errors

  return (
    <section
      id="workflow-validation"
      className="validation-panel"
      aria-labelledby="validation-title"
    >
      <div className="validation-heading">
        <div>
          <h2 id="validation-title">Workflow validation</h2>
          <div role="status">
            {current ? (
              <>
                <strong>
                  {result.valid
                    ? 'Workflow is valid'
                    : 'Workflow is incomplete or invalid'}
                </strong>
                <span className="validation-count">
                  {errors} errors · {warnings} warnings
                </span>
              </>
            ) : (
              <span>Workflow changed. Select Validate to check it again.</span>
            )}
          </div>
        </div>
        <button type="button" className="validation-close" onClick={onClose}>
          Close results
        </button>
      </div>
      {current && result.issues.length > 0 && (
        <ul className="validation-issues">
          {result.issues.map((issue, index) => (
            <IssueRow key={`${issue.code}-${index}`} issue={issue} />
          ))}
        </ul>
      )}
    </section>
  )
}
