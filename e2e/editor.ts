import { expect, type Locator, type Page } from '@playwright/test'

export const draftKey = 'flowforge:workflow:current'

export async function openEditor(page: Page, locale: 'en' | 'ko' = 'en') {
  await page.addInitScript(
    ({ locale }) => {
      localStorage.setItem('flowforge:locale', locale)
      localStorage.setItem('flowforge:onboarding:complete', 'true')
    },
    { locale },
  )
  await page.goto('/')
}

export async function openCanvasMenu(page: Page) {
  const canvas = page.getByLabel('Workflow editing area')
  await canvas.focus()
  await canvas.press('Shift+F10')
  return page.getByRole('menu', { name: 'Canvas menu' })
}

export function nodes(page: Page, type?: string) {
  return page.locator(type ? `.react-flow__node-${type}` : '.react-flow__node')
}

export function edges(page: Page) {
  return page.locator('.react-flow__edge')
}

async function center(locator: Locator) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  if (!box) throw new Error('Editor element has no visible bounds')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export async function drag(
  page: Page,
  locator: Locator,
  target: { x: number; y: number },
) {
  const point = await center(locator)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await page.mouse.move(target.x, target.y, { steps: 20 })
  await page.mouse.up()
}

export async function addNode(page: Page, name: string, x: number, y: number) {
  const group = nodes(page, name.toLowerCase())
  const count = await group.count()
  await page
    .getByRole('button', { name: `Add ${name} node`, exact: true })
    .click()
  await expect(group).toHaveCount(count + 1)
  const node = group.nth(count)
  await drag(page, node, { x, y })
  return node
}

export async function connect(
  page: Page,
  source: Locator,
  target: Locator,
  handle = 'out',
) {
  const count = await edges(page).count()
  await drag(
    page,
    source.locator(`.react-flow__handle.source[data-handleid="${handle}"]`),
    await center(target.locator('.react-flow__handle.target')),
  )
  await expect(edges(page)).toHaveCount(count + 1)
}

export async function createMergeWorkflow(page: Page) {
  const first = nodes(page, 'start').first()
  const second = await addNode(page, 'Start', 365, 450)
  const actionOne = await addNode(page, 'Action', 565, 260)
  const actionTwo = await addNode(page, 'Action', 565, 450)
  const merge = await addNode(page, 'Merge', 800, 350)
  const end = await addNode(page, 'End', 1035, 350)
  await connect(page, first, actionOne)
  await connect(page, second, actionTwo)
  await connect(page, actionOne, merge)
  await connect(page, actionTwo, merge)
  await connect(page, merge, end)
}

export async function savedDraft(page: Page) {
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
  const draft = await page.evaluate(
    (key) => localStorage.getItem(key),
    draftKey,
  )
  if (draft === null) throw new Error('Missing saved workflow')
  return draft
}
