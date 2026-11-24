import { useId, useState } from 'react'
import { useTranslation } from '@/shared/i18n'
import { conditionValueType, parseTypedValue } from '../domain/simulationInput'
import {
  CONDITION_FIELD_LIMIT,
  conditionOperators,
  conditionSymbols,
  isConditionField,
  isEqualityOperator,
  type WorkflowCondition,
} from '../model/workflowCondition'
import { DOCUMENT_LIMITS } from '../model/workflowDocument'
import { useWorkflowStore } from '../store/workflowStore'
import { TypedValueControl } from './TypedValueControl'

export function ConditionProperties({
  nodeId,
  condition,
  locked,
}: {
  nodeId: string
  condition?: WorkflowCondition
  locked: boolean
}) {
  const update = useWorkflowStore((state) => state.updateNode)
  return (
    <ConditionForm
      key={JSON.stringify(condition)}
      condition={condition}
      locked={locked}
      save={(condition) => update(nodeId, { condition })}
    />
  )
}

function ConditionForm({
  condition,
  locked,
  save,
}: {
  condition?: WorkflowCondition
  locked: boolean
  save: (condition?: WorkflowCondition) => void
}) {
  const id = useId()
  const t = useTranslation()
  const [field, setField] = useState(condition?.field ?? '')
  const [operator, setOperator] = useState<WorkflowCondition['operator']>(
    condition?.operator ?? 'eq',
  )
  const [type, setType] = useState(
    condition ? conditionValueType(condition.value) : 'number',
  )
  const [value, setValue] = useState(condition ? String(condition.value) : '')
  const [error, setError] = useState<
    'conditionInvalidField' | 'conditionInvalid' | 'conditionNumericOnly'
  >()
  const dirty =
    field !== (condition?.field ?? '') ||
    operator !== (condition?.operator ?? 'eq') ||
    value !== (condition ? String(condition.value) : '') ||
    type !== (condition ? conditionValueType(condition.value) : 'number')

  return (
    <form
      className="condition-fields"
      onSubmit={(event) => {
        event.preventDefault()
        if (locked || !dirty) return
        const name = field === condition?.field ? field : field.trim()
        if (!isConditionField(name)) return setError('conditionInvalidField')
        if (!isEqualityOperator(operator) && type !== 'number')
          return setError('conditionNumericOnly')
        const parsed = parseTypedValue(type, value)
        if (
          parsed === undefined ||
          (typeof parsed === 'string' &&
            parsed.length > DOCUMENT_LIMITS.description)
        )
          return setError('conditionInvalid')
        setError(undefined)
        save({ field: name, operator, value: parsed })
      }}
    >
      <h3>{t('conditionSettings')}</h3>
      <label htmlFor={`${id}-field`}>{t('conditionField')}</label>
      <input
        id={`${id}-field`}
        maxLength={CONDITION_FIELD_LIMIT}
        value={field}
        disabled={locked}
        placeholder={t('conditionExample')}
        onChange={(event) => setField(event.target.value)}
      />
      <label htmlFor={`${id}-operator`}>{t('conditionOperator')}</label>
      <select
        id={`${id}-operator`}
        value={operator}
        disabled={locked}
        onChange={(event) => {
          const item = conditionOperators.find(
            (item) => item === event.target.value,
          )
          if (item) setOperator(item)
        }}
      >
        {conditionOperators.map((item) => (
          <option key={item} value={item}>
            {conditionSymbols[item]} {t(`compare_${item}`)}
          </option>
        ))}
      </select>
      <label htmlFor={`${id}-type`}>{t('conditionType')}</label>
      <select
        id={`${id}-type`}
        value={type}
        disabled={locked}
        onChange={(event) => {
          const selected = event.target.value
          if (
            selected === 'number' ||
            selected === 'string' ||
            selected === 'boolean'
          ) {
            setType(selected)
            setValue('')
          }
        }}
      >
        {(['number', 'string', 'boolean'] as const).map((item) => (
          <option key={item} value={item}>
            {t(`value_${item}`)}
          </option>
        ))}
      </select>
      <label htmlFor={`${id}-value`}>{t('conditionValue')}</label>
      <TypedValueControl
        id={`${id}-value`}
        type={type}
        value={value}
        disabled={locked}
        onChange={setValue}
        maxLength={DOCUMENT_LIMITS.description}
      />
      {error && (
        <p role="alert" className="simulation-error">
          {t(error)}
        </p>
      )}
      <div className="simulation-actions">
        <button type="submit" disabled={locked || !dirty}>
          {t('conditionSave')}
        </button>
        <button
          type="button"
          disabled={locked || (!condition && !dirty)}
          onClick={() => {
            setField('')
            setOperator('eq')
            setType('number')
            setValue('')
            setError(undefined)
            if (condition) save()
          }}
        >
          {t('conditionClear')}
        </button>
      </div>
    </form>
  )
}
