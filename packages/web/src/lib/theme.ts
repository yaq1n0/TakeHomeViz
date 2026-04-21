import { ref, type Ref } from 'vue';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readStored(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    /* noop */
  }
  return null;
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveInitial(): Theme {
  return readStored() ?? (prefersDark() ? 'dark' : 'light');
}

const currentTheme: Ref<Theme> = ref<Theme>('light');

function apply(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  currentTheme.value = theme;
}

export function initTheme(): void {
  apply(resolveInitial());

  // Follow system changes only while the user has not explicitly chosen.
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', (e) => {
    if (readStored() !== null) return;
    apply(e.matches ? 'dark' : 'light');
  });
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* noop */
  }
  apply(theme);
}

export function toggleTheme(): void {
  setTheme(currentTheme.value === 'dark' ? 'light' : 'dark');
}

export function useTheme(): Ref<Theme> {
  return currentTheme;
}
