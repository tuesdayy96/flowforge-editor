import { useId, useState } from 'react'
import { useTranslation } from '@/shared/i18n'
import {
  CONDITION_FIELD_LIMIT,
  conditionOperators,
  isConditionField,
  isEqualityOperator,
  isConditionValue,
  type WorkflowCondition,
} from '../model/workflowCondition'
import { DOCUMENT_LIMITS } from '../model/workflowDocument'
import { useWorkflowStore } from '../store/workflowStore'

export function ConditionProperties({
  nodeId,
  condition,
  locked,
}: {
  nodeId: string
  condition?: WorkflowCondition
  locked: boolean
}) {
  const id = useId()
  const t = useTranslation()
  const update = useWorkflowStore((state) => state.updateNode)
  return (
    <ConditionForm
      key={JSON.stringify(condition)}
      {...{ id, t, condition, locked }}
      save={(condition) => update(nodeId, { condition })}
    />
  )
}

function ConditionForm({
  id,
  t,
  condition,
  locked,
  save,
}: {
  id: string
  t: ReturnType<typeof useTranslation>
  condition?: WorkflowCondition
  locked: boolean
  save: (condition?: WorkflowCondition) => void
}) {
  const [field, setField] = useState(condition?.field ?? '')
  const [operator, setOperator] = useState<WorkflowCondition['operator']>(
    condition?.operator ?? 'eq',
  )
  const [value, setValue] = useState(
    condition ? JSON.stringify(condition.value) : '',
  )
  const [invalid, setInvalid] = useState(false)
  return (
    <form
      className="inspector-fields condition-fields"
      onSubmit={(event) => {
        event.preventDefault()
        let parsed: unknown
        try {
          parsed = JSON.parse(value)
        } catch {
          /* Show the validation message below. */
        }
        const path = field.trim()
        if (
          !isConditionField(path) ||
          !isConditionValue(parsed) ||
          (typeof parsed === 'string' &&
            parsed.length > DOCUMENT_LIMITS.description) ||
          (!isEqualityOperator(operator) && typeof parsed !== 'number')
        ) {
          setInvalid(true)
          return
        }
        setInvalid(false)
        save({ field: path, operator, value: parsed })
      }}
    >
      <h3>{t('conditionSettings')}</h3>
      <label htmlFor={`${id}-field`}>{t('conditionField')}</label>
      <input
        id={`${id}-field`}
        maxLength={CONDITION_FIELD_LIMIT}
        value={field}
        disabled={locked}
        placeholder="order.amount"
        onChange={(event) => setField(event.target.value)}
      />
      <label htmlFor={`${id}-operator`}>{t('conditionOperator')}</label>
      <select
        id={`${id}-operator`}
        value={operator}
        disabled={locked}
        onChange={(event) => {
          const chosen = conditionOperators.find(
            (item) => item === event.target.value,
          )
          if (chosen) setOperator(chosen)
        }}
      >
        {conditionOperators.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <label htmlFor={`${id}-value`}>{t('conditionValue')}</label>
      <input
        id={`${id}-value`}
        value={value}
        placeholder="100"
        disabled={locked}
        onChange={(event) => setValue(event.target.value)}
      />
      {invalid && (
        <p role="alert" className="simulation-error">
          {t('conditionInvalid')}
        </p>
      )}
      <div className="simulation-actions">
        <button type="submit" disabled={locked}>
          {t('conditionSave')}
        </button>
        <button
          type="button"
          disabled={locked || !condition}
          onClick={() => save()}
        >
          {t('conditionClear')}
        </button>
      </div>
    </form>
  )
}
