import { useEffect, useId, useRef, useState } from 'react'
import { LanguageSelect } from '@/shared/i18n/LanguageSelect'
import { usePreferences, useTranslation } from '@/shared/i18n'
import { guideContent, tourContent } from './content'

export function GuideControls() {
  const t = useTranslation()
  const locale = usePreferences((state) => state.locale)
  const completeOnboarding = usePreferences((state) => state.completeOnboarding)
  const [mode, setMode] = useState<'guide' | 'tour' | null>(() =>
    usePreferences.getState().onboardingComplete ? null : 'tour',
  )
  const [step, setStep] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const helpRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const id = useId()
  const open = mode !== null
  const steps = tourContent[locale]
  const current = steps[step]

  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = helpRef.current
    if (!open || !dialog) return
    dialog.showModal()
    return () => {
      dialog.close()
      trigger?.focus()
    }
  }, [open])

  useEffect(() => {
    if (mode) headingRef.current?.focus()
  }, [mode, step])

  function close() {
    if (mode === 'tour') completeOnboarding()
    setMode(null)
  }

  return (
    <>
      <button
        ref={helpRef}
        type="button"
        className="toolbar-file"
        aria-haspopup="dialog"
        onClick={() => setMode('guide')}
      >
        {t('help')}
      </button>
      <dialog
        ref={dialogRef}
        className="guide-dialog"
        aria-labelledby={id}
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
      >
        {mode && (
          <>
            <header className="guide-heading">
              <h2 id={id} ref={headingRef} tabIndex={-1}>
                {t(mode)}
              </h2>
              <LanguageSelect />
              <button type="button" className="toolbar-file" onClick={close}>
                {t('close')}
              </button>
            </header>
            {mode === 'guide' ? (
              <>
                <ol
                  className="guide-contents"
                  tabIndex={0}
                  aria-label={t('guide')}
                >
                  {guideContent[locale].map(({ title, body }) => (
                    <li key={title}>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </li>
                  ))}
                </ol>
                <footer className="guide-actions">
                  <button
                    type="button"
                    className="toolbar-validate"
                    onClick={() => {
                      setStep(0)
                      setMode('tour')
                    }}
                  >
                    {t('restart')}
                  </button>
                </footer>
              </>
            ) : (
              <>
                <div className="guide-step" aria-live="polite">
                  <p>{t('step', { current: step + 1, total: steps.length })}</p>
                  <h3>{current.title}</h3>
                  <p>{current.body}</p>
                </div>
                <footer className="guide-actions">
                  <button
                    type="button"
                    className="toolbar-file"
                    onClick={close}
                  >
                    {t('skip')}
                  </button>
                  <button
                    type="button"
                    className="toolbar-file"
                    disabled={step === 0}
                    onClick={() => setStep(step - 1)}
                  >
                    {t('back')}
                  </button>
                  <button
                    type="button"
                    className="toolbar-validate"
                    onClick={
                      step === steps.length - 1
                        ? close
                        : () => setStep(step + 1)
                    }
                  >
                    {t(step === steps.length - 1 ? 'finish' : 'next')}
                  </button>
                </footer>
              </>
            )}
          </>
        )}
      </dialog>
    </>
  )
}
