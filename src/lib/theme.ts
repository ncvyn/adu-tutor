import { themeChange } from 'theme-change'

const THEME_STORAGE_KEY = 'adu-theme'
const SYSTEM_THEME = 'system'

export function getStoredTheme(): string {
  if (typeof window === 'undefined') return SYSTEM_THEME

  return localStorage.getItem(THEME_STORAGE_KEY) ?? SYSTEM_THEME
}

export function applyTheme(value: string): void {
  if (typeof window === 'undefined') return

  if (value === SYSTEM_THEME) {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches
    document.documentElement.setAttribute(
      'data-theme',
      prefersDark ? 'kuro' : 'shiro',
    )
  } else {
    document.documentElement.setAttribute('data-theme', value)
  }

  localStorage.setItem(THEME_STORAGE_KEY, value)
}

export function initTheme(): void {
  if (typeof window === 'undefined') return

  themeChange(false)
  applyTheme(getStoredTheme())
}
