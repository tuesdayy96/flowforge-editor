import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import {
  addNode,
  connect,
  nodes,
  openCanvasMenu,
  openEditor,
  savedDraft,
} from './editor'

async function setComparison(
  page: Page,
  field: string,
  type: 'number' | 'string' | 'boolean',
  value: string,
  operator = 'eq',
) {
  await page.getByLabel('Item to compare').fill(field)
  await page.getByLabel('Comparison', { exact: true }).selectOption(operator)
  await page.getByLabel('Value type').selectOption(type)
  const valueField = page.getByLabel('Reference value')
  if (type === 'boolean') await valueField.selectOption(value)
  else await valueField.fill(value)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
}

test('edits a localized Condition and synchronizes typed input with an independent JSON draft', async ({
  page,
}) => {
  await openEditor(page)
  const condition = await addNode(page, 'Condition', 640, 325)
  const yes = await addNode(page, 'End', 940, 240)
  const no = await addNode(page, 'End', 940, 460)
  await connect(page, nodes(page, 'start'), condition)
  await connect(page, condition, yes, 'true')
  await connect(page, condition, no, 'false')
  await expect(condition.getByText('No comparison set')).toBeVisible()
  const toggle = page.getByRole('button', { name: 'Simulator', exact: true })
  const simulator = page.getByRole('region', { name: 'Simulator' })
  await toggle.click()
  await condition.dblclick()
  await expect(simulator).toBeHidden()
  await expect(page.getByLabel('Label', { exact: true })).toBeFocused()
  const boxes = await Promise.all(
    [
      'Label',
      'Description',
      'Item to compare',
      'Comparison',
      'Reference value',
    ].map((name) => page.getByLabel(name, { exact: true }).boundingBox()),
  )
  for (const box of boxes) {
    expect(box?.x).toBe(boxes[0]?.x)
    expect(box?.width).toBe(boxes[0]?.width)
  }
  await expect(
    page.getByRole('option', { name: '≥ Greater than or equal to' }),
  ).toHaveAttribute('value', 'gte')
  await setComparison(page, '  주문 금액  ', 'number', '100000', 'gte')
  await expect(condition.getByText('주문 금액 ≥ 100,000')).toBeVisible()
  await toggle.click()
  const mode = simulator.getByLabel('Input mode')
  await expect(mode).toHaveValue('form')
  const item = simulator.getByLabel('주문 금액', { exact: true })
  await expect(item).toHaveValue('100000')
  await item.fill('150000')
  await mode.selectOption('json')
  const json = simulator.getByLabel('Simulation input (JSON)')
  await expect(json).toHaveValue(/"주문 금액": 150000/)
  await json.fill('{"주문 금액":')
  await simulator.getByRole('button', { name: 'Apply JSON' }).click()
  await expect(simulator.getByRole('alert')).toContainText(
    'Applied input is preserved',
  )
  await expect(
    simulator.getByRole('button', { name: 'Start simulation' }),
  ).toBeDisabled()
  await mode.selectOption('form')
  await expect(item).toHaveValue('150000')
  await mode.selectOption('json')
  await expect(json).toHaveValue('{"주문 금액":')
  await json.fill('{"주문 금액": 50000, "extra": true}')
  await simulator.getByRole('button', { name: 'Apply JSON' }).click()
  await mode.selectOption('form')
  await expect(item).toHaveValue('50000')
  await condition.dblclick()
  await setComparison(page, '주문 금액', 'number', '60000', 'gte')
  await toggle.click()
  await expect(item).toHaveValue('50000')
  await simulator.getByRole('button', { name: 'Start simulation' }).click()
  await condition.dblclick()
  await expect(simulator).toBeVisible()
  await expect(item).toBeDisabled()
  await simulator.getByRole('button', { name: 'Step', exact: true }).click()
  await simulator.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(
    simulator.getByRole('list', { name: 'Execution log' }),
  ).toContainText('Branch selected: false')
  await expect(no).toHaveClass(/simulation-node-current/)
  await simulator.getByRole('button', { name: 'Step', exact: true }).click()
  await condition.dblclick()
  await expect(page.getByLabel('Reference value')).toHaveValue('60000')
  await toggle.click()
  await expect(simulator.getByRole('status')).toHaveText('Completed')
  await expect(item).toHaveValue('50000')
})

test('keeps names and typed comparisons through undo, redo, reload and JSON import', async ({
  page,
}) => {
  await openEditor(page)
  const condition = await addNode(page, 'Condition', 640, 320)
  await condition.dblclick()
  await setComparison(page, '고객등급', 'string', 'VIP')
  await expect(condition.getByText('고객등급 = "VIP"')).toBeVisible()
  await setComparison(page, '승인여부', 'boolean', 'false')
  await expect(condition.getByText('승인여부 = false')).toBeVisible()
  await (
    await openCanvasMenu(page)
  )
    .getByRole('menuitem', { name: 'Undo' })
    .click()
  await expect(condition.getByText('고객등급 = "VIP"')).toBeVisible()
  await (
    await openCanvasMenu(page)
  )
    .getByRole('menuitem', { name: 'Redo' })
    .click()
  await expect(condition.getByText('승인여부 = false')).toBeVisible()
  const language = page.locator('.toolbar').getByRole('combobox')
  await language.selectOption('ko')
  await expect(condition.getByText('승인여부 = false')).toBeVisible()
  await language.selectOption('en')
  const before = await savedDraft(page)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const exported = await download
  const content = await readFile(await exported.path(), 'utf8')
  expect(JSON.parse(content)).toEqual(JSON.parse(before))
  expect(JSON.parse(content)).toMatchObject({
    schemaVersion: 1,
    nodes: expect.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          condition: { field: '승인여부', operator: 'eq', value: false },
        }),
      }),
    ]),
  })
  await page.reload()
  await expect(
    nodes(page, 'condition').getByText('승인여부 = false'),
  ).toBeVisible()
  await nodes(page, 'condition').dblclick()
  await setComparison(page, 'temporary', 'number', '1')
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('input[type=file]').setInputFiles({
    name: 'workflow.json',
    mimeType: 'application/json',
    buffer: Buffer.from(content),
  })
  await expect(
    nodes(page, 'condition').getByText('승인여부 = false'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Simulator', exact: true }).click()
  await expect(page.getByLabel('승인여부', { exact: true })).toHaveValue(
    'false',
  )
})

test('deduplicates legacy paths and reports conflicting value types in the form', async ({
  page,
}) => {
  await openEditor(page)
  const first = await addNode(page, 'Condition', 580, 280)
  const second = await addNode(page, 'Condition', 860, 430)
  await first.dblclick()
  await setComparison(page, 'order.amount', 'number', '100')
  await second.dblclick()
  await setComparison(page, 'order.amount', 'number', '200')
  const toggle = page.getByRole('button', { name: 'Simulator', exact: true })
  await toggle.click()
  const simulator = page.getByRole('region', { name: 'Simulator' })
  const amount = simulator.getByLabel('order.amount', { exact: true })
  await expect(amount).toHaveCount(1)
  await expect(amount).toHaveValue('100')
  await amount.fill('140')
  await second.dblclick()
  await setComparison(page, 'order.amount', 'string', 'VIP')
  await toggle.click()
  await expect(amount).toBeDisabled()
  await expect(
    simulator.getByText('Conditions use different value types for this item.'),
  ).toBeVisible()
  await simulator.getByLabel('Input mode').selectOption('json')
  await expect(simulator.getByLabel('Simulation input (JSON)')).toHaveValue(
    /"amount": 140/,
  )
  await second.dblclick()
  await page.getByRole('button', { name: 'Reset comparison' }).click()
  await toggle.click()
  await simulator.getByLabel('Input mode').selectOption('form')
  await expect(amount).toHaveCount(1)
  await expect(amount).toBeEnabled()
  await expect(amount).toHaveValue('140')
})
