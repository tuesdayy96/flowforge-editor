import { expect, test } from '@playwright/test'
import {
  addNode,
  connect,
  edges,
  nodes,
  openCanvasMenu,
  openEditor,
  savedDraft,
} from './editor'

test('opens More, focuses properties and duplicates a single node with one undo', async ({
  page,
}) => {
  await openEditor(page)
  const action = await addNode(page, 'Action', 590, 310)
  await action.click()
  const toolbar = page.getByRole('group', { name: 'Node actions' })
  await expect(toolbar).toHaveCount(1)
  const more = toolbar.getByRole('button', { name: 'More actions' })
  await more.click()
  const menu = page.getByRole('menu', { name: 'Node menu' })
  await expect(
    menu.getByRole('menuitem', { name: 'Edit properties' }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(more).toBeFocused()
  await more.click()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Label', { exact: true })).toBeFocused()
  await expect(menu).toBeHidden()
  await more.click()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await expect(menu.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(menu).toBeHidden()
  await expect(nodes(page, 'action')).toHaveCount(2)
  const ids = await nodes(page, 'action').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-id')),
  )
  expect(new Set(ids).size).toBe(2)
  await (
    await openCanvasMenu(page)
  )
    .getByRole('menuitem', { name: 'Undo' })
    .click()
  await expect(nodes(page, 'action')).toHaveCount(1)
  await expect(toolbar).toHaveCount(0)
})

test('keeps group targets on right-click and duplicates only their internal edges', async ({
  page,
}) => {
  await openEditor(page)
  const action = await addNode(page, 'Action', 570, 295)
  const end = await addNode(page, 'End', 870, 410)
  const start = nodes(page, 'start')
  await connect(page, start, action)
  await connect(page, action, end)
  await action.click()
  await end.click({ modifiers: ['ControlOrMeta'] })
  const toolbar = page.getByRole('group', { name: 'Selection actions' })
  await expect(toolbar).toHaveCount(1)
  await action.click({ button: 'right' })
  const menu = page.getByRole('menu', { name: 'Selection menu' })
  await expect(menu).toBeVisible()
  const language = page.locator('.toolbar').getByRole('combobox')
  await language.selectOption('ko')
  await expect(page.getByRole('menu', { name: '선택 그룹 메뉴' })).toBeVisible()
  await language.selectOption('en')
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(2)
  await menu.getByRole('menuitem', { name: 'Copy selected' }).click()
  await expect(menu).toBeHidden()
  await start.click({ button: 'right' })
  await expect(page.getByRole('menu', { name: 'Node menu' })).toBeVisible()
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(1)
  await expect(start).toHaveClass(/\bselected\b/)
  await page.keyboard.press('Escape')
  await action.click()
  await end.click({ modifiers: ['ControlOrMeta'] })
  await toolbar.getByRole('button', { name: 'Duplicate selected' }).click()
  await expect(nodes(page)).toHaveCount(5)
  await expect(edges(page)).toHaveCount(3)
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(2)
  await toolbar.getByRole('button', { name: 'Delete selected' }).click()
  await expect(nodes(page)).toHaveCount(3)
  await expect(edges(page)).toHaveCount(2)
  await (
    await openCanvasMenu(page)
  )
    .getByRole('menuitem', { name: 'Undo' })
    .click()
  await expect(nodes(page)).toHaveCount(5)
  await expect(edges(page)).toHaveCount(3)
})

test('opens canvas and connection menus, clamps to the viewport and guards disabled commands', async ({
  page,
}) => {
  await openEditor(page)
  await page.mouse.click(1020, 560, { button: 'right' })
  const canvasMenu = page.getByRole('menu', { name: 'Canvas menu' })
  await expect(canvasMenu).toBeVisible()
  const paste = canvasMenu.getByRole('menuitem', { name: 'Paste' })
  await expect(paste).toBeDisabled()
  await paste.evaluate((button: HTMLButtonElement) => button.click())
  await expect(canvasMenu).toBeVisible()
  await expect(nodes(page)).toHaveCount(1)
  await expect(
    canvasMenu.getByRole('menuitem', { name: 'Undo' }),
  ).toBeDisabled()
  await expect(
    canvasMenu.getByRole('menuitem', { name: 'Redo' }),
  ).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(canvasMenu).toBeHidden()
  await expect(page.getByLabel('Workflow editing area')).toBeFocused()
  const action = await addNode(page, 'Action', 650, 300)
  await connect(page, nodes(page, 'start'), action)
  const before = await savedDraft(page)
  const path = edges(page).locator('.react-flow__edge-interaction')
  const point = await path.evaluate((element: SVGPathElement) => {
    const point = element.getPointAtLength(element.getTotalLength() / 2)
    const matrix = element.getScreenCTM()
    if (!matrix) throw new Error('Missing edge transform')
    const { x, y } = point.matrixTransform(matrix)
    return { x, y }
  })
  await page.mouse.click(point.x, point.y, { button: 'right' })
  const edgeMenu = page.getByRole('menu', { name: 'Connection menu' })
  await expect(edgeMenu).toBeVisible()
  expect(await savedDraft(page)).toBe(before)
  await page.mouse.click(1020, 560)
  await expect(edgeMenu).toBeHidden()
  await page.mouse.click(point.x, point.y, { button: 'right' })
  await edgeMenu.getByRole('menuitem', { name: 'Delete connection' }).click()
  await expect(edges(page)).toHaveCount(0)
  await expect(edgeMenu).toBeHidden()
  await (
    await openCanvasMenu(page)
  )
    .getByRole('menuitem', { name: 'Undo' })
    .click()
  await expect(edges(page)).toHaveCount(1)
  await page.getByRole('button', { name: 'MiniMap', exact: true }).click()
  const pane = await page.locator('.react-flow__pane').boundingBox()
  if (!pane) throw new Error('Missing pane bounds')
  await page.mouse.click(
    pane.x + pane.width - 5,
    Math.min(pane.y + pane.height, 900) - 27,
    { button: 'right' },
  )
  await expect(canvasMenu).toBeVisible()
  const box = await canvasMenu.boundingBox()
  const viewport = page.viewportSize()
  if (!box || !viewport) throw new Error('Missing bounds')
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - 7)
  await page.keyboard.press('Escape')
  await action.click()
  await page
    .getByRole('group', { name: 'Node actions' })
    .getByRole('button', { name: 'Copy', exact: true })
    .click()
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  const location = { x: 955, y: 510 }
  await page.mouse.click(location.x, location.y, { button: 'right' })
  await canvasMenu.getByRole('menuitem', { name: 'Paste' }).click()
  await expect(nodes(page, 'action')).toHaveCount(2)
  const pasted = await nodes(page, 'action').last().boundingBox()
  if (!pasted) throw new Error('Missing pasted node bounds')
  expect(pasted.x + pasted.width / 2).toBeCloseTo(location.x, 0)
  expect(pasted.y + pasted.height / 2).toBeCloseTo(location.y, 0)
})
