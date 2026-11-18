import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { translator, usePreferences, type Locale } from '@/shared/i18n'
import { connectWorkflowPersistence } from '@/features/workflow/services/workflowPersistence'
import '@/styles/global.css'

const persistence = connectWorkflowPersistence(() => window.localStorage)
function applyLocale(locale: Locale) {
  document.documentElement.lang = locale
  document.title = translator(locale)('appTitle')
}
applyLocale(usePreferences.getState().locale)
const unsubscribeLanguage = usePreferences.subscribe(({ locale }, previous) => {
  if (locale !== previous.locale) applyLocale(locale)
})
const flushWhenHidden = () => {
  if (document.visibilityState === 'hidden') persistence.flush()
}
window.addEventListener('pagehide', persistence.flush)
document.addEventListener('visibilitychange', flushWhenHidden)

import.meta.hot?.dispose(() => {
  unsubscribeLanguage()
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
