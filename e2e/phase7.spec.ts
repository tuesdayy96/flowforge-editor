import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { addNode, connect, drag, nodes, openEditor, savedDraft } from './editor'

test('keeps the marquee during drag and preserves group editing after release', async ({
  page,
}) => {
  await openEditor(page)
  const first = await addNode(page, 'Action', 580, 280)
  const second = await addNode(page, 'End', 850, 430)
  const start = nodes(page, 'start')
  await connect(page, first, second)
  await start.click()
  await first.click({ modifiers: ['ControlOrMeta'] })
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(2)
  await page.keyboard.down('Shift')
  await page.mouse.move(460, 215)
  await page.mouse.down()
  await page.mouse.move(965, 495, { steps: 12 })
  await expect(page.locator('.react-flow__selection')).toBeVisible()
  await expect(first).toHaveClass(/\bselected\b/)
  await expect(second).toHaveClass(/\bselected\b/)
  await page.mouse.up()
  await page.keyboard.up('Shift')
  await expect(page.locator('.react-flow__selection')).toHaveCount(0)
  const group = page.locator('.react-flow__nodesselection-rect')
  await expect(group).toBeVisible()
  await expect(page.locator('.react-flow__edge.selected')).toHaveCount(1)
  await expect(group).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(group).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)')
  for (const node of [first, second]) {
    await expect(node.locator('.workflow-node')).not.toHaveCSS(
      'box-shadow',
      'none',
    )
  }
  await expect(
    page.getByRole('heading', { name: '2 nodes selected' }),
  ).toBeVisible()
  const positions = async () =>
    page
      .locator('.react-flow__node.selected')
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).transform),
      )
  const before = await positions()
  await drag(page, group, { x: 755, y: 390 })
  await expect.poll(positions).not.toEqual(before)
  const after = await positions()
  expect(after).toHaveLength(2)
  expect(after[0]).not.toBe(before[0])
  expect(after[1]).not.toBe(before[1])
  await page.getByRole('button', { name: 'Copy', exact: true }).click()
  await page.getByRole('button', { name: 'Paste', exact: true }).click()
  await expect(nodes(page)).toHaveCount(5)
  await page
    .getByRole('button', { name: 'Delete selection', exact: true })
    .click()
  await expect(nodes(page)).toHaveCount(3)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(nodes(page)).toHaveCount(5)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(nodes(page)).toHaveCount(3)
  await first.click()
  await page.mouse.click(490, 560)
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Copy', exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole('heading', { name: 'No node selected' }),
  ).toBeVisible()
})

test('simulates both Condition branches and keeps history, storage, and export clean', async ({
  page,
}) => {
  await openEditor(page)
  const start = nodes(page, 'start')
  const condition = await addNode(page, 'Condition', 625, 300)
  const onTrue = await addNode(page, 'End', 945, 240)
  const onFalse = await addNode(page, 'End', 945, 430)
  await connect(page, start, condition)
  await connect(page, condition, onTrue, 'true')
  await connect(page, condition, onFalse, 'false')
  await condition.click()
  await page.getByLabel('Input field path').fill('amount')
  await page.getByLabel('Operator', { exact: true }).selectOption('gte')
  await page.getByLabel('Comparison value (JSON)').fill('100')
  await page.getByRole('button', { name: 'Save comparison' }).click()
  const before = await savedDraft(page)
  await page.getByRole('button', { name: 'Simulator', exact: true }).click()
  const sim = page.getByRole('region', { name: 'Simulator' })
  const button = (name: string) =>
    sim.getByRole('button', { name, exact: true })
  const status = sim.getByRole('status')
  const log = sim.getByRole('list', { name: 'Execution log' })
  const startId = await start.getAttribute('data-id')
  if (!startId) throw new Error('Missing start ID')
  await sim.getByLabel('Start node').selectOption(startId)
  await sim.getByLabel('Simulation input (JSON)').fill('{"amount":150}')
  await button('Start simulation').click()
  await expect(start).toHaveClass(/simulation-node-current/)
  await expect(
    page.getByRole('button', { name: 'Undo', exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Add Action node' }),
  ).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Import JSON' })).toBeDisabled()
  await button('Step').click()
  await button('Step').click()
  await expect(log).toContainText('Branch selected: true')
  await expect(onTrue).toHaveClass(/simulation-node-current/)
  await expect(page.locator('.react-flow__edge.simulation-edge')).toHaveCount(2)
  await button('Step').click()
  await expect(status).toHaveText('Completed')
  await button('Reset').click()
  await sim.getByLabel('Simulation input (JSON)').fill('{"amount":50}')
  await sim.getByLabel('Run speed').selectOption('1000')
  await button('Start simulation').click()
  await button('Run').click()
  await expect(status).toContainText('Running')
  await button('Pause').click()
  await expect(status).toContainText('Paused')
  await sim.getByLabel('Run speed').selectOption('200')
  await button('Resume').click()
  await expect(status).toHaveText('Completed')
  await expect(log).toContainText('Branch selected: false')
  await expect(log).toContainText('Reached End')
  await expect(onFalse).toHaveClass(/simulation-node-visited/)
  const language = page.locator('.toolbar').getByRole('combobox')
  await language.selectOption('ko')
  await expect(
    page.locator('#workflow-simulator').getByRole('status'),
  ).toHaveText('완료')
  await language.selectOption('en')
  await expect(status).toHaveText('Completed')
  await expect(
    page.getByRole('button', { name: 'Add Action node' }),
  ).toBeEnabled()
  expect(await savedDraft(page)).toBe(before)
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const file = await downloaded
  expect(JSON.parse(await readFile(await file.path(), 'utf8'))).toEqual(
    JSON.parse(before),
  )
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await condition.click()
  await page.getByRole('button', { name: 'Simulator', exact: true }).click()
  await expect(page.getByLabel('Input field path')).toHaveValue('')
})

test('stops a pending automatic step', async ({ page }) => {
  await openEditor(page)
  const end = await addNode(page, 'End', 700, 330)
  await connect(page, nodes(page, 'start'), end)
  await page.clock.install()
  await page.getByRole('button', { name: 'Simulator', exact: true }).click()
  const sim = page.getByRole('region', { name: 'Simulator' })
  await sim.getByRole('button', { name: 'Start simulation' }).click()
  await sim.getByRole('button', { name: 'Run', exact: true }).click()
  await sim.getByLabel('Run speed').selectOption('200')
  await sim.getByRole('button', { name: 'Stop', exact: true }).click()
  await page.clock.runFor(1100)
  await expect(sim.getByRole('status')).toHaveText('Stopped')
  await expect(sim.getByRole('listitem')).toHaveCount(0)
})
