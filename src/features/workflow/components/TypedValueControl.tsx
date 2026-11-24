import { useTranslation } from '@/shared/i18n'

export function TypedValueControl({
  id,
  type,
  value,
  disabled,
  onChange,
  maxLength,
  invalid,
}: {
  id: string
  type: 'number' | 'string' | 'boolean'
  value: string
  disabled: boolean
  onChange: (value: string) => void
  maxLength?: number
  invalid?: boolean
}) {
  const t = useTranslation()
  if (type === 'boolean')
    return (
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
      >
        <option value="" disabled>
          {t('valueChoose')}
        </option>
        <option value="true">{t('valueTrue')}</option>
        <option value="false">{t('valueFalse')}</option>
      </select>
    )
  return (
    <input
      id={id}
      value={value}
      disabled={disabled}
      autoComplete="off"
      maxLength={maxLength}
      inputMode={type === 'number' ? 'decimal' : undefined}
      aria-invalid={invalid}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
