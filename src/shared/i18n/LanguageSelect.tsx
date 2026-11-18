import { usePreferences, useTranslation } from './index'

export function LanguageSelect() {
  const t = useTranslation()
  const locale = usePreferences((state) => state.locale)
  const setLocale = usePreferences((state) => state.setLocale)

  return (
    <select
      className="toolbar-file language-select"
      aria-label={t('language')}
      value={locale}
      onChange={(event) => setLocale(event.target.value === 'en' ? 'en' : 'ko')}
    >
      <option value="ko" lang="ko">
        한국어
      </option>
      <option value="en" lang="en">
        English
      </option>
    </select>
  )
}
