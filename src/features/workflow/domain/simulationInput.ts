import {
  conditionPath,
  isSafeInputKey,
  type ConditionValue,
  type WorkflowCondition,
} from '../model/workflowCondition'
import type { GraphSnapshot } from '../model/workflowNode'

export type SimulationInput = Readonly<Record<string, unknown>>
type InputType = 'number' | 'string' | 'boolean'
export interface SimulationField {
  name: string
  path: string[]
  type: InputType
  example: ConditionValue
  conflict?: 'type' | 'path'
}

function isInputObject(value: unknown): value is SimulationInput {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateSimulationInput(
  text: string,
): SimulationInput | undefined {
  try {
    const input: unknown = JSON.parse(text, (key, value: unknown) => {
      if (
        !isSafeInputKey(key) ||
        (typeof value === 'number' && !Number.isFinite(value))
      )
        throw new Error('Invalid simulation input')
      return value
    })
    return isInputObject(input) ? input : undefined
  } catch {
    return undefined
  }
}

export function conditionValueType(value: ConditionValue): InputType {
  if (typeof value === 'number') return 'number'
  return typeof value === 'boolean' ? 'boolean' : 'string'
}

export function collectSimulationFields(
  nodes: readonly GraphSnapshot['nodes'][number][],
): SimulationField[] {
  const fields = new Map<string, SimulationField>()
  for (const node of nodes) {
    const condition: WorkflowCondition | undefined =
      node.type === 'condition' ? node.data.condition : undefined
    if (!condition) continue
    const path = conditionPath(condition.field)
    if (!path) continue
    const type = conditionValueType(condition.value)
    const existing = fields.get(condition.field)
    if (existing) {
      if (existing.type !== type) existing.conflict = 'type'
    } else {
      fields.set(condition.field, {
        name: condition.field,
        path,
        type,
        example: condition.value,
      })
    }
  }
  for (const field of fields.values()) {
    for (let length = 1; length < field.path.length; length++) {
      const parent = fields.get(field.path.slice(0, length).join('.'))
      if (parent) {
        parent.conflict = 'path'
        field.conflict = 'path'
      }
    }
  }
  return [...fields.values()]
}

export function lookupInput(
  input: SimulationInput,
  path: readonly string[],
): { kind: 'missing' | 'blocked' } | { kind: 'found'; value: unknown } {
  let current: unknown = input
  for (const key of path) {
    if (!isSafeInputKey(key) || !isInputObject(current))
      return { kind: 'blocked' }
    if (!Object.hasOwn(current, key)) return { kind: 'missing' }
    current = current[key]
  }
  return { kind: 'found', value: current }
}

export function writeInputValue(
  input: SimulationInput,
  path: readonly string[],
  value: ConditionValue,
): SimulationInput {
  const [key, ...remaining] = path
  if (key === undefined || !isSafeInputKey(key)) return input
  const prior = Object.hasOwn(input, key) ? input[key] : undefined
  if (!remaining.length)
    return Object.is(prior, value) ? input : { ...input, [key]: value }
  const branch = prior === undefined ? {} : prior
  if (!isInputObject(branch)) return input
  const updated = writeInputValue(branch, remaining, value)
  return updated === branch ? input : { ...input, [key]: updated }
}

export function addMissingInputFields(
  input: SimulationInput,
  fields: readonly SimulationField[],
): SimulationInput {
  return fields.reduce(
    (current, field) =>
      field.conflict || lookupInput(current, field.path).kind !== 'missing'
        ? current
        : writeInputValue(current, field.path, field.example),
    input,
  )
}

export function parseTypedValue(
  type: InputType,
  value: string,
): ConditionValue | undefined {
  if (type === 'string') return value
  if (type === 'boolean') {
    if (value === 'true') return true
    if (value === 'false') return false
    return
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()))
    return
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}
