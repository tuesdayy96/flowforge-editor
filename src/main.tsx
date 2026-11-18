import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { connectWorkflowPersistence } from '@/features/workflow/services/workflowPersistence'
import '@/styles/global.css'

const persistence = connectWorkflowPersistence(() => window.localStorage)
const flushWhenHidden = () => {
  if (document.visibilityState === 'hidden') persistence.flush()
}
window.addEventListener('pagehide', persistence.flush)
document.addEventListener('visibilitychange', flushWhenHidden)

import.meta.hot?.dispose(() => {
  window.removeEventListener('pagehide', persistence.flush)
  document.removeEventListener('visibilitychange', flushWhenHidden)
  persistence.flush()
  persistence.disconnect()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App persistence={persistence} />
  </StrictMode>,
)
