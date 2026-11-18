import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import {
  addNode,
  connect,
  createMergeWorkflow,
  draftKey,
  drag,
  edges,
  nodes,
  openEditor,
  savedDraft,
} from './editor'

test('creates and connects nodes, edits properties and keeps console free of errors', async ({
  page,
}) => {
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text())
  })
  await openEditor(page)
  const start = nodes(page, 'start')
  await expect(
    start.getByRole('heading', { name: 'Start', exact: true }),
  ).toBeVisible()
  const action = await addNode(page, 'Action', 565, 350)
  const condition = await addNode(page, 'Condition', 810, 350)
  await connect(page, start, action)
  await connect(page, action, condition)
  await action.click()
  await page.getByLabel('Label', { exact: true }).fill('Check order')
  await page
    .getByLabel('Description', { exact: true })
    .fill('Verify the incoming details')
  await expect(
    action.getByRole('heading', { name: 'Check order' }),
  ).toBeVisible()
  await expect(action.getByText('Verify the incoming details')).toBeVisible()
  await expect(edges(page)).toHaveCount(2)
  expect(failures).toEqual([])
})

test('accepts a complete multi-Start graph with a Merge', async ({ page }) => {
  await openEditor(page)
  await createMergeWorkflow(page)
  await expect(nodes(page, 'start')).toHaveCount(2)
  await expect(edges(page)).toHaveCount(5)
  await page.getByRole('button', { name: 'Validate', exact: true }).click()
  await expect(
    page.getByText('Workflow is valid', { exact: true }),
  ).toBeVisible()
})

test('undoes and redoes a single drag with canvas shortcuts', async ({
  page,
}) => {
  await openEditor(page)
  const action = await addNode(page, 'Action', 600, 350)
  const before = await action.evaluate((element) => element.style.transform)
  await drag(page, action, { x: 765, y: 435 })
  const after = await action.evaluate((element) => element.style.transform)
  expect(after).not.toBe(before)
  await page.keyboard.press('Control+z')
  await expect(action).toBeVisible()
  await expect
    .poll(() => action.evaluate((element) => element.style.transform))
    .toBe(before)
  await page.keyboard.press('Control+Shift+z')
  await expect(action).toBeVisible()
  await expect
    .poll(() => action.evaluate((element) => element.style.transform))
    .toBe(after)
})

test('copies a selection with its connections and fits the canvas', async ({
  page,
}) => {
  await openEditor(page)
  const action = await addNode(page, 'Action', 600, 350)
  await connect(page, nodes(page, 'start'), action)
  const canvas = page.getByLabel('Workflow editing area')
  await canvas.focus()
  await page.keyboard.press('Control+a')
  await expect(
    page.getByRole('heading', { name: '2 nodes selected' }),
  ).toBeVisible()
  await page.keyboard.press('Control+c')
  await page.keyboard.press('Control+v')
  await expect(nodes(page)).toHaveCount(4)
  await expect(edges(page)).toHaveCount(2)
  await page.keyboard.press('Control+z')
  await expect(nodes(page)).toHaveCount(2)
  await expect(edges(page)).toHaveCount(1)

  const minimap = page.getByRole('img', { name: 'Workflow minimap' })
  await expect(minimap).toBeVisible()
  const toggle = page.getByRole('button', { name: 'MiniMap', exact: true })
  await toggle.click()
  await expect(minimap).toBeHidden()
  await toggle.click()
  await expect(minimap).toBeVisible()
  await page.locator('.react-flow__controls-zoomin').click()
  const viewport = page.locator('.react-flow__viewport')
  await expect
    .poll(() => viewport.evaluate((element) => element.style.transform))
    .not.toMatch(/scale\(1\)$/)
  const zoomed = await viewport.evaluate((element) => element.style.transform)
  await canvas.focus()
  await page.keyboard.press('Control+0')
  await expect
    .poll(() => viewport.evaluate((element) => element.style.transform))
    .not.toBe(zoomed)
})

test('restores saved edits and viewport and round-trips a JSON download', async ({
  page,
}) => {
  await openEditor(page)
  const action = await addNode(page, 'Action', 630, 350)
  await connect(page, nodes(page, 'start'), action)
  await action.click()
  await page.getByLabel('Label', { exact: true }).fill('Saved action')
  await page.locator('.react-flow__controls-zoomin').click()
  const viewport = page.locator('.react-flow__viewport')
  await expect
    .poll(() => viewport.evaluate((element) => element.style.transform))
    .not.toContain('scale(1)')
  const transform = await viewport.evaluate(
    (element) => element.style.transform,
  )
  const saved = JSON.parse(await savedDraft(page))
  expect(saved.viewport.zoom).toBeGreaterThan(1)
  await page.reload()
  await expect(
    action.getByRole('heading', { name: 'Saved action' }),
  ).toBeVisible()
  await expect(edges(page)).toHaveCount(1)
  await expect
    .poll(() => viewport.evaluate((element) => element.style.transform))
    .toBe(transform)
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const download = await downloadEvent
  const json = await readFile(await download.path(), 'utf8')
  expect(JSON.parse(json)).toEqual(saved)
  await page.getByRole('button', { name: 'Add End node' }).click()
  await expect(nodes(page, 'end')).toHaveCount(1)
  const file = page.locator('input[type=file]')
  await file.setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  })
  await expect(page.getByRole('alert')).toContainText('Required field missing')
  await expect(nodes(page, 'end')).toHaveCount(1)
  page.once('dialog', (dialog) => dialog.accept())
  await file.setInputFiles({
    name: download.suggestedFilename(),
    mimeType: 'application/json',
    buffer: Buffer.from(json),
  })
  await expect(nodes(page, 'end')).toHaveCount(0)
  expect(JSON.parse(await savedDraft(page))).toEqual(saved)
  await expect(
    page.getByRole('button', { name: 'Undo', exact: true }),
  ).toBeDisabled()
})

test('changes language without changing custom data and restores the preference', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
  await page.getByRole('button', { name: '건너뛰기' }).click()
  await nodes(page, 'start').click()
  await page.getByLabel('이름', { exact: true }).fill('Custom entry')
  await expect(page.getByText('로컬에 저장됨', { exact: true })).toBeVisible()
  const before = await page.evaluate(
    (key) => localStorage.getItem(key),
    draftKey,
  )
  await page.getByRole('button', { name: '검증', exact: true }).click()
  const validation = page.locator('#workflow-validation')
  await expect(validation).toContainText('End 노드를 하나 이상 추가하세요.')
  const language = page.locator('.toolbar').getByRole('combobox')
  await language.selectOption('en')
  await expect(page.getByRole('button', { name: 'Validate' })).toBeVisible()
  await expect(validation).toContainText('Add at least one End node.')
  await expect(nodes(page, 'start')).toHaveClass(/\bselected\b/)
  for (const type of ['Start', 'Action', 'Condition', 'Merge', 'End']) {
    await expect(
      page.getByRole('button', { name: `Add ${type} node` }),
    ).toBeVisible()
  }
  await expect(
    nodes(page, 'start').getByRole('heading', { name: 'Custom entry' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Undo', exact: true }),
  ).toBeEnabled()
  await language.selectOption('ko')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
  await language.selectOption('en')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(
    await page.evaluate((key) => localStorage.getItem(key), draftKey),
  ).toBe(before)
})

test('walks through first-run onboarding and reopens it from the guide', async ({
  page,
}) => {
  await page.goto('/')
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('heading', { name: '빠른 둘러보기' }),
  ).toBeVisible()
  await dialog.getByRole('button', { name: '다음', exact: true }).click()
  await expect(
    dialog.getByRole('heading', { name: '워크플로 캔버스' }),
  ).toBeVisible()
  await dialog.getByRole('button', { name: '건너뛰기' }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(dialog).toBeHidden()
  const help = page.getByRole('button', { name: '도움말' })
  await help.click()
  await expect(
    dialog.getByRole('heading', { name: '사용자 가이드' }),
  ).toBeVisible()
  await dialog.getByRole('combobox').selectOption('en')
  await expect(
    dialog.getByRole('heading', { name: 'User guide' }),
  ).toBeVisible()
  await expect(dialog.locator('ol > li')).toHaveCount(12)
  await dialog.getByRole('button', { name: 'Restart tour' }).click()
  for (let step = 0; step < 4; step++)
    await dialog.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(
    dialog.getByRole('heading', { name: 'Save, import and export' }),
  ).toBeVisible()
  await dialog.getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByRole('button', { name: 'Help' })).toBeFocused()
  await page.getByRole('button', { name: 'Help' }).click()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  expect(
    await page.evaluate((key) => localStorage.getItem(key), draftKey),
  ).toBeNull()
})
