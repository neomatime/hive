export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'hive-theme'

const listeners = new Set<() => void>()

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// Matches the server-rendered HTML (always light) -- the blocking script in
// app/layout.tsx applies the real theme before hydration, same no-flash
// pattern as the sidebar-collapse state in dashboard-shell.tsx.
export function getThemeServerSnapshot(): Theme {
  return 'light'
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  listeners.forEach((listener) => listener())
}

export function toggleTheme() {
  setTheme(getThemeSnapshot() === 'dark' ? 'light' : 'dark')
}
