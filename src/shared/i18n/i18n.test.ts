import { afterEach, describe, expect, it, vi } from 'vitest'
import { en } from './en'
import { ko } from './ko'
import {
  LOCALE_KEY,
  ONBOARDING_KEY,
  preferredLocale,
  translator,
} from './index'
import { guideContent, tourContent } from '@/features/guide/content'
import {
  documentErrorMessage,
  validationMessage,
} from '@/features/workflow/components/workflowMessages'
import { WorkflowDocumentError } from '@/features/workflow/model/workflowDocument'
import { nodeLabels } from '@/features/workflow/model/workflowNode'

afterEach(() => vi.unstubAllGlobals())

describe('editor localization', () => {
  it('defaults to Korean and keeps the same keys and interpolation parameters', () => {
    expect(preferredLocale(null)).toBe('ko')
    expect(preferredLocale('fr')).toBe('ko')
    expect(preferredLocale('en')).toBe('en')
    expect(Object.keys(ko).sort()).toEqual(Object.keys(en).sort())
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const params = (message: string) =>
        [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
      expect(params(ko[key])).toEqual(params(en[key]))
    }
  })

  it('persists only preference keys and restores locale and tour state', async () => {
    const data = new Map<string, string>()
    const storedDraft = 'existing draft'
    data.set('flowforge:workflow:current', storedDraft)
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    })
    vi.resetModules()
    const session = await import('./index')
    expect(session.usePreferences.getState().locale).toBe('ko')
    expect(session.usePreferences.getState().onboardingComplete).toBe(false)
    session.usePreferences.getState().setLocale('en')
    session.usePreferences.getState().completeOnboarding()
    expect(data.get(LOCALE_KEY)).toBe('en')
    expect(data.get(ONBOARDING_KEY)).toBe('true')
    expect(data.get('flowforge:workflow:current')).toBe(storedDraft)
    vi.resetModules()
    const nextSession = await import('./index')
    expect(nextSession.usePreferences.getState()).toMatchObject({
      locale: 'en',
      onboardingComplete: true,
    })
  })

  it('translates the same issue and document error without changing node names or handle IDs', () => {
    const issue = {
      code: 'missing-output',
      severity: 'error',
      nodeType: 'condition',
      output: 'false',
    } as const
    expect(validationMessage(translator('en'), issue)).toBe(
      'Connect the false branch.',
    )
    expect(validationMessage(translator('ko'), issue)).toBe(
      'false 분기를 연결하세요.',
    )
    const error = new WorkflowDocumentError('missing-field', {
      field: 'schemaVersion',
    })
    expect(documentErrorMessage(translator('en'), error)).toContain(
      'schemaVersion',
    )
    expect(documentErrorMessage(translator('ko'), error)).toMatch(
      /필수 필드.*schemaVersion/,
    )
    for (const locale of ['ko', 'en'] as const) {
      expect(guideContent[locale]).toHaveLength(12)
      expect(tourContent[locale]).toHaveLength(5)
      for (const node of Object.values(nodeLabels)) {
        expect(translator(locale)('addNode', { type: node })).toContain(node)
        expect(guideContent[locale][1].body).toContain(node)
      }
    }
  })
})
