import type { ReactNode } from 'react'

interface AppLayoutProps {
  toolbar: ReactNode
  palette: ReactNode
  canvas: ReactNode
  inspector: ReactNode
}

export function AppLayout({
  toolbar,
  palette,
  canvas,
  inspector,
}: AppLayoutProps) {
  return (
    <div className="editor">
      {toolbar}
      <div className="workspace">
        {palette}
        {canvas}
        {inspector}
      </div>
    </div>
  )
}
