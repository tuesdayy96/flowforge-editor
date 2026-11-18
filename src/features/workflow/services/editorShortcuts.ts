const textEditorSelector =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

export function isTextEditor(target: EventTarget | null) {
  return (
    typeof Element !== 'undefined' &&
    target instanceof Element &&
    Boolean(target.closest(textEditorSelector))
  )
}

type Command =
  'undo' | 'redo' | 'copy' | 'paste' | 'selectAll' | 'remove' | 'fit'

export function shortcutCommand(
  event: Pick<
    KeyboardEvent,
    'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'
  >,
): Command | undefined {
  if (event.altKey) return
  const key = event.key.toLowerCase()
  if (event.ctrlKey || event.metaKey) {
    if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
    if (event.shiftKey) return
    if (key === 'y' && event.ctrlKey && !event.metaKey) return 'redo'
    if (key === 'c') return 'copy'
    if (key === 'v') return 'paste'
    if (key === 'a') return 'selectAll'
    if (key === '0') return 'fit'
  } else if (key === 'delete' || key === 'backspace') {
    return 'remove'
  }
}

export function bindEditorShortcuts(
  surface: EventTarget,
  commands: Record<Command, () => void>,
) {
  function onKeyDown(raw: Event) {
    const event = raw as KeyboardEvent
    if (
      event.defaultPrevented ||
      event.isComposing ||
      isTextEditor(event.target)
    )
      return
    const command = shortcutCommand(event)
    if (!command) return
    event.preventDefault()
    if (!event.repeat) commands[command]()
  }

  surface.addEventListener('keydown', onKeyDown)
  return () => surface.removeEventListener('keydown', onKeyDown)
}
