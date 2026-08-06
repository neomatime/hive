import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  getThemeServerSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeTheme,
  toggleTheme,
} from './theme-store'

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  window.localStorage.clear()
})

describe('getThemeSnapshot', () => {
  it('returns light when the dark class is absent', () => {
    expect(getThemeSnapshot()).toBe('light')
  })
  it('returns dark when the dark class is present', () => {
    document.documentElement.classList.add('dark')
    expect(getThemeSnapshot()).toBe('dark')
  })
})

describe('getThemeServerSnapshot', () => {
  it('always returns light, matching the server-rendered HTML', () => {
    expect(getThemeServerSnapshot()).toBe('light')
  })
})

describe('setTheme', () => {
  it('adds the dark class and persists the choice when set to dark', () => {
    setTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
  it('removes the dark class and persists the choice when set to light', () => {
    document.documentElement.classList.add('dark')
    setTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })
  it('notifies subscribers', () => {
    const listener = vi.fn()
    subscribeTheme(listener)
    setTheme('dark')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('toggleTheme', () => {
  it('flips from light to dark', () => {
    toggleTheme()
    expect(getThemeSnapshot()).toBe('dark')
  })
  it('flips from dark to light', () => {
    setTheme('dark')
    toggleTheme()
    expect(getThemeSnapshot()).toBe('light')
  })
})

describe('subscribeTheme', () => {
  it('returns an unsubscribe function that stops further notifications', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeTheme(listener)
    unsubscribe()
    setTheme('dark')
    expect(listener).not.toHaveBeenCalled()
  })
})
