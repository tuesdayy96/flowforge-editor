export const conditionOperators = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
] as const
export type ConditionValue = string | number | boolean
export interface WorkflowCondition {
  field: string
  operator: (typeof conditionOperators)[number]
  value: ConditionValue
}

export const CONDITION_FIELD_LIMIT = 256

export const conditionSymbols = {
  eq: '=',
  neq: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
} satisfies Record<WorkflowCondition['operator'], string>

export function isSafeInputKey(key: string) {
  return key !== '__proto__' && key !== 'prototype' && key !== 'constructor'
}

export function conditionPath(field: string) {
  if (field.length > CONDITION_FIELD_LIMIT) return
  const parts = field.split('.')
  if (
    parts.every(
      (part) =>
        part.trim() &&
        isSafeInputKey(part) &&
        !Array.from(part).some((char) => {
          const code = char.charCodeAt(0)
          return code < 32 || code === 127
        }),
    )
  )
    return parts
}

export function isConditionField(field: string) {
  return Boolean(conditionPath(field))
}

export function formatCondition(condition: WorkflowCondition, locale: string) {
  const { field, operator, value } = condition
  const formatted =
    typeof value === 'number'
      ? new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(
          value,
        )
      : JSON.stringify(value)
  return `${field} ${conditionSymbols[operator]} ${formatted}`
}

export function isEqualityOperator(operator: WorkflowCondition['operator']) {
  return operator === 'eq' || operator === 'neq'
}

export function isConditionValue(value: unknown): value is ConditionValue {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  )
}
