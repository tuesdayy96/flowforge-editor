import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindEditorShortcuts } from './editorShortcuts'

function key(
  target: EventTarget,
  key: string,
  options: Partial<KeyboardEvent> = {},
) {
  const event = Object.assign(new Event('keydown', { cancelable: true }), {
    key,
    ...options,
  })
  target.dispatchEvent(event)
  return event
}

function handlers() {
  return {
    undo: vi.fn(),
    redo: vi.fn(),
    copy: vi.fn(),
    paste: vi.fn(),
    selectAll: vi.fn(),
    remove: vi.fn(),
    fit: vi.fn(),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('editor shortcuts', () => {
  it('handles canvas shortcuts and leaves unrelated keys alone', () => {
    const surface = new EventTarget()
    const actions = handlers()
    const remove = bindEditorShortcuts(surface, actions)
    expect(key(surface, 'z', { ctrlKey: true }).defaultPrevented).toBe(true)
    key(surface, 'Z', { metaKey: true, shiftKey: true })
    key(surface, 'y', { ctrlKey: true })
    key(surface, 'c', { metaKey: true })
    key(surface, 'v', { ctrlKey: true })
    key(surface, 'a', { ctrlKey: true })
    key(surface, 'Delete')
    key(surface, 'Backspace')
    key(surface, '0', { metaKey: true })
    expect(key(surface, 'x', { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(actions.undo).toHaveBeenCalledTimes(1)
    expect(actions.redo).toHaveBeenCalledTimes(2)
    expect(actions.copy).toHaveBeenCalledTimes(1)
    expect(actions.paste).toHaveBeenCalledTimes(1)
    expect(actions.selectAll).toHaveBeenCalledTimes(1)
    expect(actions.remove).toHaveBeenCalledTimes(2)
    expect(actions.fit).toHaveBeenCalledTimes(1)
    remove()
    expect(key(surface, 'z', { ctrlKey: true }).defaultPrevented).toBe(false)
    expect(actions.undo).toHaveBeenCalledTimes(1)
  })

  it('leaves editable targets and other page targets to native behavior', () => {
    class Input extends EventTarget {
      closest() {
        return this
      }
    }
    vi.stubGlobal('Element', Input)
    const actions = handlers()
    const remove = bindEditorShortcuts(new Input(), actions)
    const textTarget = new Input()
    const unbind = bindEditorShortcuts(textTarget, actions)
    for (const value of ['a', 'c', 'v', 'z', 'Backspace']) {
      expect(
        key(textTarget, value, { ctrlKey: value !== 'Backspace' })
          .defaultPrevented,
      ).toBe(false)
    }
    expect(
      key(new EventTarget(), 'z', { ctrlKey: true }).defaultPrevented,
    ).toBe(false)
    for (const action of Object.values(actions))
      expect(action).not.toHaveBeenCalled()
    remove()
    unbind()
  })
})
