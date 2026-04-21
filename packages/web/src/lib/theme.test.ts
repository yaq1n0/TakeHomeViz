import { vi, beforeEach, afterEach } from 'vitest';

type MqlStub = {
  matches: boolean;
  listeners: Set<(e: MediaQueryListEvent) => void>;
  addEventListener: (t: string, cb: (e: MediaQueryListEvent) => void) => void;
  removeEventListener: (t: string, cb: (e: MediaQueryListEvent) => void) => void;
};

let mql: MqlStub;

function installMql(matches = false): void {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  mql = {
    matches,
    listeners,
    addEventListener: (_t, cb) => {
      listeners.add(cb);
    },
    removeEventListener: (_t, cb) => {
      listeners.delete(cb);
    },
  };
  vi.stubGlobal('matchMedia', () => mql);
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: () => mql,
  });
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  installMql(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('theme', () => {
  it('initTheme respects stored "dark"', async () => {
    localStorage.setItem('theme', 'dark');
    const mod = await import('./theme');
    mod.initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initTheme ignores system preference when stored value exists', async () => {
    installMql(true); // system prefers dark
    localStorage.setItem('theme', 'light');
    const mod = await import('./theme');
    mod.initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('initTheme follows prefers-color-scheme when nothing is stored', async () => {
    installMql(true);
    const mod = await import('./theme');
    mod.initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initTheme falls back to light when nothing stored and system is light', async () => {
    const mod = await import('./theme');
    mod.initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('system change is a no-op when a stored preference exists', async () => {
    localStorage.setItem('theme', 'light');
    const mod = await import('./theme');
    mod.initTheme();
    mql.listeners.forEach((cb) => cb({ matches: true } as MediaQueryListEvent));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('system change applies when no stored preference', async () => {
    const mod = await import('./theme');
    mod.initTheme();
    mql.listeners.forEach((cb) => cb({ matches: true } as MediaQueryListEvent));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    mql.listeners.forEach((cb) => cb({ matches: false } as MediaQueryListEvent));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setTheme persists to localStorage and toggles the class', async () => {
    const mod = await import('./theme');
    mod.setTheme('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    mod.setTheme('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleTheme flips between light and dark', async () => {
    const mod = await import('./theme');
    mod.initTheme();
    expect(mod.useTheme().value).toBe('light');
    mod.toggleTheme();
    expect(mod.useTheme().value).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    mod.toggleTheme();
    expect(mod.useTheme().value).toBe('light');
  });

  it('localStorage.getItem throwing is handled silently (falls back)', async () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const mod = await import('./theme');
    expect(() => mod.initTheme()).not.toThrow();
    expect(() => mod.setTheme('dark')).not.toThrow();
    spy.mockRestore();
    setSpy.mockRestore();
  });
});
