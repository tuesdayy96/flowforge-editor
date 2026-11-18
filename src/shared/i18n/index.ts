import { useMemo } from 'react'
import { create } from 'zustand'
import { en, type Messages } from './en'
import { ko } from './ko'

export const LOCALE_KEY = 'flowforge:locale'
export const ONBOARDING_KEY = 'flowforge:onboarding:complete'
const dictionaries = { ko, en }
export type Locale = keyof typeof dictionaries
export type MessageKey = keyof Messages

function readPreference(key: string) {
  try {
    return globalThis.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writePreference(key: string, value: string) {
  try {
    globalThis.localStorage.setItem(key, value)
  } catch {
    /* Keep the session preference. */
  }
}

export function preferredLocale(value: string | null): Locale {
  return value === 'en' ? 'en' : 'ko'
}

export const usePreferences = create<{
  locale: Locale
  onboardingComplete: boolean
  setLocale: (locale: Locale) => void
  completeOnboarding: () => void
}>((set) => ({
  locale: preferredLocale(readPreference(LOCALE_KEY)),
  onboardingComplete: readPreference(ONBOARDING_KEY) === 'true',
  setLocale: (locale) => {
    writePreference(LOCALE_KEY, locale)
    set({ locale })
  },
  completeOnboarding: () => {
    writePreference(ONBOARDING_KEY, 'true')
    set({ onboardingComplete: true })
  },
}))

export function translator(locale: Locale) {
  return (
    key: MessageKey,
    params: Record<string, string | number | undefined> = {},
  ) =>
    dictionaries[locale][key].replace(/\{(\w+)\}/g, (token, name: string) =>
      String(params[name] ?? token),
    )
}

export function useTranslation() {
  const locale = usePreferences((state) => state.locale)
  return useMemo(() => translator(locale), [locale])
}
