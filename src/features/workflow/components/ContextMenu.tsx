import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

export interface MenuItem {
  label: string
  execute: () => void
  icon: string
  disabled?: boolean
  danger?: boolean
  shortcut?: string
  divider?: boolean
}

export function ContextMenu({
  x,
  y,
  label,
  items,
  close,
  toggleAnchor,
}: {
  x: number
  y: number
  label: string
  items: MenuItem[]
  toggleAnchor: HTMLElement | SVGElement | null
  close: (restoreFocus?: boolean) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const menu = ref.current
    if (!menu) return
    function position() {
      if (!menu) return
      const { width, height } = menu.getBoundingClientRect()
      menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - width - 8))}px`
      menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - height - 8))}px`
    }
    position()
    menu
      .querySelector<HTMLButtonElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      )
      ?.focus({ preventScroll: true })
    if (!menu.contains(document.activeElement))
      menu.focus({ preventScroll: true })
    const resize = new ResizeObserver(position)
    resize.observe(menu)
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menu?.contains(event.target) &&
        !toggleAnchor?.contains(event.target)
      )
        close()
    }
    document.addEventListener('pointerdown', outside, true)
    window.addEventListener('resize', position)
    return () => {
      resize.disconnect()
      document.removeEventListener('pointerdown', outside, true)
      window.removeEventListener('resize', position)
    }
  }, [x, y, close, toggleAnchor])

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault()
      close(true)
      return
    }
    const buttons = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ),
    ]
    const focused = buttons.findIndex(
      (button) => button === document.activeElement,
    )
    let index: number
    switch (event.key) {
      case 'ArrowDown':
        index = (focused + 1) % buttons.length
        break
      case 'ArrowUp':
        index =
          (focused < 0 ? buttons.length - 1 : focused - 1 + buttons.length) %
          buttons.length
        break
      case 'Home':
        index = 0
        break
      case 'End':
        index = buttons.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    buttons[index]?.focus()
  }

  return createPortal(
    <div
      className="context-menu"
      ref={ref}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={navigate}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          tabIndex={-1}
          aria-disabled={item.disabled || undefined}
          className={`context-item${item.danger ? ' context-danger' : ''}${item.divider ? ' context-divider' : ''}`}
          onClick={() => {
            if (item.disabled) return
            item.execute()
            close(true)
          }}
        >
          <span className="context-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
          {item.shortcut && <kbd aria-hidden="true">{item.shortcut}</kbd>}
        </button>
      ))}
    </div>,
    document.body,
  )
}
