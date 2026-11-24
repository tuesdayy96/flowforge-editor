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

export function isConditionField(field: string) {
  return (
    field.length <= CONDITION_FIELD_LIMIT &&
    field.split('.').every((part) => part.trim().length > 0)
  )
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
