import { useId, useState } from 'react'
import { useTranslation } from '@/shared/i18n'
import {
  lookupInput,
  parseTypedValue,
  type SimulationField,
} from '../domain/simulationInput'
import { isConditionValue } from '../model/workflowCondition'
import { useSimulationStore } from '../store/simulationStore'
import { TypedValueControl } from './TypedValueControl'

export function SimulationInputEditor({
  locked,
  mode,
  setMode,
  draft,
  setDraft,
}: {
  locked: boolean
  mode: 'form' | 'json'
  setMode: (mode: 'form' | 'json') => void
  draft: string | undefined
  setDraft: (draft: string | undefined) => void
}) {
  const id = useId()
  const t = useTranslation()
  const { input, fields, applyInput } = useSimulationStore()
  const [invalid, setInvalid] = useState(false)

  return (
    <div className="simulation-input">
      <label htmlFor={`${id}-mode`}>{t('simInputMode')}</label>
      <select
        id={`${id}-mode`}
        value={mode}
        onChange={(event) =>
          setMode(event.target.value === 'json' ? 'json' : 'form')
        }
      >
        <option value="form">{t('simInputForm')}</option>
        <option value="json">JSON</option>
      </select>
      {mode === 'form' ? (
        <fieldset className="simulation-condition-inputs">
          <legend>{t('simConditionInputs')}</legend>
          {draft !== undefined && (
            <p className="simulation-hint">{t('simDraftPending')}</p>
          )}
          {!fields.length && (
            <p className="simulation-hint">{t('simNoFields')}</p>
          )}
          {fields.map((field) => (
            <SimulationFieldInput
              key={field.name}
              field={field}
              locked={locked}
            />
          ))}
        </fieldset>
      ) : (
        <>
          <label htmlFor={`${id}-json`}>{t('simInput')}</label>
          <textarea
            id={`${id}-json`}
            rows={6}
            spellCheck={false}
            value={draft ?? JSON.stringify(input, null, 2)}
            disabled={locked}
            aria-invalid={invalid}
            aria-describedby={`${id}-hint`}
            onChange={(event) => {
              setInvalid(false)
              setDraft(event.target.value)
            }}
          />
          <p id={`${id}-hint`} className="simulation-hint">
            {t('simInputHint')}
          </p>
          {invalid && (
            <p role="alert" className="simulation-error">
              {t('simDraftInvalid')}
            </p>
          )}
          {fields.some((field) => field.conflict) && (
            <p className="simulation-error">{t('simInputConflicts')}</p>
          )}
          <div className="simulation-actions">
            <button
              type="button"
              disabled={locked || draft === undefined}
              onClick={() => {
                if (draft === undefined) return
                if (applyInput(draft)) {
                  setInvalid(false)
                  setDraft(undefined)
                } else setInvalid(true)
              }}
            >
              {t('simApplyInput')}
            </button>
            <button
              type="button"
              disabled={locked || draft === undefined}
              onClick={() => {
                setInvalid(false)
                setDraft(undefined)
              }}
            >
              {t('simDiscardInput')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SimulationFieldInput({
  field,
  locked,
}: {
  field: SimulationField
  locked: boolean
}) {
  const id = useId()
  const t = useTranslation()
  const input = useSimulationStore((state) => state.input)
  const change = useSimulationStore((state) => state.changeInput)
  const [text, setText] = useState<string>()
  const result = lookupInput(input, field.path)
  const value = result.kind === 'found' ? result.value : undefined
  const matches = typeof value === field.type
  const blocked =
    result.kind === 'blocked' ||
    (result.kind === 'found' && !isConditionValue(value))
  const invalidNumber =
    field.type === 'number' &&
    text !== undefined &&
    parseTypedValue('number', text) === undefined
  const warning =
    field.conflict === 'type'
      ? 'simTypeConflict'
      : field.conflict === 'path' || blocked
        ? 'simPathConflict'
        : result.kind === 'found' && !matches
          ? 'simValueTypeMismatch'
          : undefined
  return (
    <div className="simulation-input-field" onBlur={() => setText(undefined)}>
      <label htmlFor={id}>{field.name}</label>
      <TypedValueControl
        id={id}
        type={field.type}
        value={text ?? (matches ? String(value) : '')}
        disabled={locked || Boolean(field.conflict) || blocked}
        invalid={invalidNumber}
        onChange={(next) => {
          if (field.type === 'number') setText(next)
          const parsed = parseTypedValue(field.type, next)
          if (parsed !== undefined) change(field.name, parsed)
        }}
      />
      {warning && <p className="simulation-error">{t(warning)}</p>}
      {invalidNumber && (
        <p className="simulation-error">{t('simNumberInvalid')}</p>
      )}
    </div>
  )
}
