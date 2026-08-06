'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  subscribeTheme,
  toggleTheme,
} from '@/lib/theme/theme-store'

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot)
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
      className="grid size-9 place-items-center rounded-lg border bg-background"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
