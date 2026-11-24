import { expect, it } from 'vitest'
import {
  conditionPath,
  conditionSymbols,
  formatCondition,
  type WorkflowCondition,
} from '../model/workflowCondition'
import { evaluateCondition } from './simulation'
import {
  addMissingInputFields,
  collectSimulationFields,
  lookupInput,
  parseTypedValue,
  validateSimulationInput,
  writeInputValue,
} from './simulationInput'

function fields(...conditions: WorkflowCondition[]) {
  return collectSimulationFields(
    conditions.map((condition, index) => ({
      id: String(index),
      type: 'condition',
      position: { x: 0, y: 0 },
      data: { label: 'Condition', description: '', condition },
    })),
  )
}

it('keeps literal Unicode item names separate from legacy dotted paths', () => {
  const amount = {
    field: '주문 금액 #1',
    operator: 'gte',
    value: 100000,
  } as const
  const legacy = { field: 'order.amount', operator: 'eq', value: 100 } as const
  const input = addMissingInputFields(
    { 'order.amount': 777 },
    fields(amount, legacy, { ...amount, value: 1 }),
  )
  expect(input).toEqual({
    '주문 금액 #1': 100000,
    order: { amount: 100 },
    'order.amount': 777,
  })
  expect(fields(amount, legacy, amount)).toHaveLength(2)
  expect(evaluateCondition(amount, input)).toBe(true)
  expect(evaluateCondition(legacy, { 'order.amount': 100 })).toBeUndefined()
  expect(evaluateCondition(legacy, input)).toBe(true)
  expect(formatCondition(amount, 'ko')).toBe('주문 금액 #1 ≥ 100,000')
})

it('preserves configured input when examples change, fields are renamed, or a parent is blocked', () => {
  const original = {
    field: 'order.amount',
    operator: 'gte',
    value: 100,
  } as const
  const input = { order: { amount: 50 }, user: [], nil: null }
  const result = addMissingInputFields(
    input,
    fields(
      { ...original, value: 200 },
      { ...original, field: 'renamed' },
      { ...original, field: 'user.active' },
      { ...original, field: 'nil.active' },
    ),
  )
  expect(result).toEqual({ ...input, renamed: 100 })
  expect(addMissingInputFields(result, [])).toBe(result)
  expect(lookupInput(result, ['user', 'active']).kind).toBe('blocked')
  expect(writeInputValue(result, ['nil', 'active'], true)).toBe(result)
})

it('identifies shared-field type conflicts and scalar/nested collisions without picking a default', () => {
  const base = { field: 'order.amount', operator: 'eq', value: 100 } as const
  const type = fields(base, { ...base, value: '100' })
  expect(type).toMatchObject([{ name: 'order.amount', conflict: 'type' }])
  const prefix = fields(base, { ...base, field: 'order' })
  expect(prefix.map((item) => item.conflict)).toEqual(['path', 'path'])
  const prior = { order: { amount: 20 } }
  expect(addMissingInputFields(prior, prefix)).toBe(prior)
  expect(addMissingInputFields(prior, type)).toBe(prior)
})

it('rejects invalid paths and prototype keys without mutating existing objects', () => {
  for (const field of [
    '',
    'a..b',
    'a. .b',
    'a.__proto__.b',
    'constructor.prototype',
    'line\nbreak',
  ])
    expect(conditionPath(field)).toBeUndefined()
  expect(
    validateSimulationInput('{"a":[{"__proto__":{"polluted":true}}]}'),
  ).toBeUndefined()
  expect(validateSimulationInput('{"constructor":1}')).toBeUndefined()
  expect(validateSimulationInput('{"x":1e999}')).toBeUndefined()
  expect(validateSimulationInput('null')).toBeUndefined()
  expect(validateSimulationInput('[]')).toBeUndefined()
  const input = {}
  expect(writeInputValue(input, ['safe', '__proto__', 'polluted'], true)).toBe(
    input,
  )
  expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false)
})

it('uses explicit value types and displays all operator symbols', () => {
  expect(Object.values(conditionSymbols)).toEqual([
    '=',
    '≠',
    '>',
    '≥',
    '<',
    '≤',
  ])
  expect(parseTypedValue('string', '123')).toBe('123')
  expect(parseTypedValue('number', '123')).toBe(123)
  expect(parseTypedValue('number', '0x10')).toBeUndefined()
  expect(parseTypedValue('boolean', 'false')).toBe(false)
  expect(parseTypedValue('boolean', '0')).toBeUndefined()
  expect(
    evaluateCondition(
      { field: '승인여부', operator: 'eq', value: true },
      { 승인여부: true },
    ),
  ).toBe(true)
  expect(
    evaluateCondition(
      { field: '등급', operator: 'eq', value: 'VIP' },
      { 등급: 'VIP' },
    ),
  ).toBe(true)
  expect(
    formatCondition({ field: '등급', operator: 'eq', value: 'VIP' }, 'en'),
  ).toBe('등급 = "VIP"')
  expect(
    formatCondition({ field: '승인여부', operator: 'eq', value: true }, 'en'),
  ).toBe('승인여부 = true')
})
